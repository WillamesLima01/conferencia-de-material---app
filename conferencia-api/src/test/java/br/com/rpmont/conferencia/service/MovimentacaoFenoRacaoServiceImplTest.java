package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.*;
import br.com.rpmont.conferencia.enums.*;
import br.com.rpmont.conferencia.exception.*;
import br.com.rpmont.conferencia.model.*;
import br.com.rpmont.conferencia.repository.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Stream;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Chamadas Java diretas; nenhuma persistencia ou configuracao externa. */
class MovimentacaoFenoRacaoServiceImplTest {
    private UsuarioRepository usuarios;
    private LoteFenoRacaoRepository lotes;
    private MovimentacaoFenoRacaoRepository movimentos;
    private NotificacaoFenoRacaoRepository notificacoes;
    private NotificacaoFenoRacaoService notificacaoService;
    private EntityManager em;
    private MovimentacaoFenoRacaoService service;
    private Usuario usuario;
    private LoteFenoRacao lote;

    @BeforeEach void preparar() {
        usuarios = mock(UsuarioRepository.class); lotes = mock(LoteFenoRacaoRepository.class);
        movimentos = mock(MovimentacaoFenoRacaoRepository.class);
        notificacoes = mock(NotificacaoFenoRacaoRepository.class);
        notificacaoService = mock(NotificacaoFenoRacaoService.class); em = mock(EntityManager.class);
        service = new MovimentacaoFenoRacaoServiceImpl(movimentos, lotes, usuarios, notificacoes, em, notificacaoService);
        usuario = new Usuario(); usuario.setId(7L); usuario.setMatricula("SAIDA-SINTETICA");
        usuario.setNivel(3); usuario.setSetor("Baia"); usuario.setUnidade("RPMont");
        usuario.setAtivo(true); usuario.setStatusAcesso("LIBERADO");
        when(usuarios.findByMatricula(usuario.getMatricula())).thenReturn(Optional.of(usuario));
        ProdutoFenoRacao produto = new ProdutoFenoRacao(); produto.setId(1);
        produto.setTipoProduto(TipoProdutoFenoRacao.FENO); produto.setNomeProduto("Produto sintetico");
        produto.setUnidadeControle(UnidadeControleFenoRacao.FARDO); produto.setPesoUnidadeKg(new BigDecimal("20.00"));
        lote = new LoteFenoRacao(); lote.setId(11); lote.setProduto(produto); lote.setCodigoLote("LOTE-SINTETICO");
        lote.setUnidade("RPMont"); lote.setSituacao(SituacaoLoteFenoRacao.ATIVO);
        lote.setQuantidadeAtual(10); lote.setPesoTotalAtualKg(new BigDecimal("200.00"));
    }
    private RegistrarSaidaFenoRacaoRequestDTO request(String kg) {
        return new RegistrarSaidaFenoRacaoRequestDTO(11, new BigDecimal(kg), LocalDate.now(),
                "Servico sintetico", "Responsavel sintetico", "DOC-SINTETICO", "Observacao sintetica");
    }
    private void prepararGravacao() {
        when(lotes.findByIdAndUnidade(11, usuario.getUnidade().trim())).thenReturn(Optional.of(lote));
        when(movimentos.saveAndFlush(any())).thenAnswer(i -> {
            MovimentacaoFenoRacao m = i.getArgument(0); m.setId(31L); return m;
        });
    }
    private List<Object> estadoLote() {
        return Arrays.asList(lote.getQuantidadeAtual(), lote.getPesoTotalAtualKg(), lote.getSituacao(),
                lote.getUsuarioModificadorId(), lote.getDataModificacao());
    }
    static Stream<Arguments> autorizados() {
        return Stream.of("RPMont", "3º EPMont").flatMap(unidade -> Arrays.stream(TipoProdutoFenoRacao.values())
                .flatMap(tipo -> Stream.of(Arguments.of(1, null, unidade, tipo),
                        Arguments.of(2, "P4", unidade, tipo), Arguments.of(3, "Baia", unidade, tipo),
                        Arguments.of(3, "Baias", unidade, tipo), Arguments.of(3, "Fiscal-de-dia", unidade, tipo))));
    }
    @ParameterizedTest @MethodSource("autorizados")
    void perfisAutorizadosRegistramFenoERacoes(int nivel, String setor, String unidade, TipoProdutoFenoRacao tipo) {
        usuario.setNivel(nivel); usuario.setSetor(setor); usuario.setUnidade(unidade);
        lote.setUnidade(unidade); lote.getProduto().setTipoProduto(tipo);
        lote.getProduto().setUnidadeControle(tipo == TipoProdutoFenoRacao.FENO ? UnidadeControleFenoRacao.FARDO : UnidadeControleFenoRacao.SACO);
        prepararGravacao();
        var resposta = service.registrarSaida(request("21"), usuario.getMatricula());
        assertEquals(31L, resposta.id()); assertEquals(tipo, resposta.tipoProduto());
        assertEquals(2, resposta.quantidadeUnidades()); assertEquals(10, resposta.saldoAnterior());
        assertEquals(8, resposta.saldoPosterior()); assertEquals(8, lote.getQuantidadeAtual());
        assertEquals(0, new BigDecimal("40").compareTo(resposta.pesoMovimentadoKg()));
        assertEquals(0, new BigDecimal("19").compareTo(resposta.sobraCalculadaKg()));
        assertEquals(0, new BigDecimal("160").compareTo(lote.getPesoTotalAtualKg()));
        assertEquals(unidade, resposta.unidadeOrigem()); assertEquals(7L, resposta.usuarioId());
        assertEquals(setor, resposta.usuarioSetor()); assertEquals(TipoMovimentacaoFenoRacao.SAIDA, resposta.tipoMovimentacao());
        assertEquals(SituacaoMovimentacaoFenoRacao.ATIVA, resposta.situacao());
        verify(lotes).findByIdAndUnidade(11, unidade); verify(lotes, never()).findById(any());
        verify(lotes).save(same(lote)); verify(movimentos).saveAndFlush(any()); verify(em).refresh(any());
        verifyNoInteractions(notificacoes, notificacaoService);
    }
    @ParameterizedTest @ValueSource(strings = {" baia ", "BAIAS", "Baía", "Fiscal de dia", "fiscal_de_dia", "FISCALDEDIA", " fiscal-de-dia "})
    void normalizaSomenteAliasesConhecidos(String setor) {
        usuario.setSetor(setor); prepararGravacao();
        assertEquals(31L, service.registrarSaida(request("20"), usuario.getMatricula()).id());
    }
    @ParameterizedTest @ValueSource(strings = {" rpmont ", "3EPMont", "3º EPMont", " 3º   epmont ", "RPMónt"})
    void normalizaUnidadeParaAutorizarSemAlterarParametroDoRepositorio(String unidade) {
        usuario.setUnidade(unidade); prepararGravacao();
        service.registrarSaida(request("20"), usuario.getMatricula());
        verify(lotes).findByIdAndUnidade(11, unidade.trim());
    }
    static Stream<Arguments> unidadesNaoAutorizadas() {
        return Stream.of(1, 2, 3).flatMap(nivel -> Stream.of("RPMºONT", "RPMONTº", "3ºº EPMont",
                "OUTRA", "RPMONT-OUTRA", "13º EPMont", "3 EPMont", "3-EPMont", "3_EPMont",
                "R PMont", "R-P-MONT")
                .map(unidade -> Arguments.of(nivel, unidade)));
    }
    @ParameterizedTest @MethodSource("unidadesNaoAutorizadas")
    void ordinalMalformadoOuUnidadeForaDaListaNuncaConsultaEstoque(int nivel, String unidade) {
        usuario.setNivel(nivel); usuario.setUnidade(unidade); var antes = estadoLote();
        assertThrows(ForbiddenException.class, () -> service.registrarSaida(request("20"), usuario.getMatricula()));
        assertEquals(antes, estadoLote());
        verifyNoInteractions(lotes, movimentos, em, notificacoes, notificacaoService);
    }
    static Stream<Arguments> negados() {
        return Stream.of(
                Arguments.of(null, "Baia", "RPMont", true, "LIBERADO"),
                Arguments.of(0, "Baia", "RPMont", true, "LIBERADO"),
                Arguments.of(4, "Baia", "RPMont", true, "LIBERADO"),
                Arguments.of(-1, "Baia", "RPMont", true, "LIBERADO"),
                Arguments.of(3, null, "RPMont", true, "LIBERADO"),
                Arguments.of(3, "", "RPMont", true, "LIBERADO"),
                Arguments.of(3, "  ", "RPMont", true, "LIBERADO"),
                Arguments.of(3, "P4", "RPMont", true, "LIBERADO"),
                Arguments.of(3, "Comando", "RPMont", true, "LIBERADO"),
                Arguments.of(3, "Baia auxiliar", "RPMont", true, "LIBERADO"),
                Arguments.of(3, "Baias P4", "RPMont", true, "LIBERADO"),
                Arguments.of(3, "Fiscal-de-dia auxiliar", "RPMont", true, "LIBERADO"),
                Arguments.of(3, "BAIA/COMANDO", "RPMont", true, "LIBERADO"),
                Arguments.of(1, null, "OUTRA", true, "LIBERADO"),
                Arguments.of(2, "Baia", "OUTRA", true, "LIBERADO"),
                Arguments.of(3, "Baias", "OUTRA", true, "LIBERADO"),
                Arguments.of(3, "Baia", "RPMONT-OUTRA", true, "LIBERADO"),
                Arguments.of(3, "Baia", "13º EPMont", true, "LIBERADO"),
                Arguments.of(3, "Baia", null, true, "LIBERADO"),
                Arguments.of(3, "Baia", " ", true, "LIBERADO"),
                Arguments.of(1, null, "RPMont", false, "LIBERADO"),
                Arguments.of(2, "Baia", "RPMont", null, "LIBERADO"),
                Arguments.of(3, "Baia", "RPMont", true, "BLOQUEADO"),
                Arguments.of(3, "Baia", "RPMont", true, "PENDENTE"),
                Arguments.of(3, "Baia", "RPMont", true, null));
    }
    @ParameterizedTest @MethodSource("negados")
    void negativaOcorreAntesDeConsultarLoteOuAlterarEstoque(Integer nivel, String setor, String unidade,
                                                          Boolean ativo, String status) {
        usuario.setNivel(nivel); usuario.setSetor(setor); usuario.setUnidade(unidade);
        usuario.setAtivo(ativo); usuario.setStatusAcesso(status); var antes = estadoLote();
        assertThrows(ForbiddenException.class, () -> service.registrarSaida(request("21"), usuario.getMatricula()));
        assertEquals(antes, estadoLote());
        verifyNoInteractions(lotes, movimentos, em, notificacoes, notificacaoService);
    }
    @Test void autorizacaoPrecedeAteAValidacaoDoRequest() {
        usuario.setSetor("P4");
        assertThrows(ForbiddenException.class, () -> service.registrarSaida(null, usuario.getMatricula()));
        verifyNoInteractions(lotes, movimentos, em, notificacoes, notificacaoService);
    }
    @ParameterizedTest @ValueSource(ints = {1, 2, 3})
    void loteDeOutraUnidadeNaoTemFallbackGlobalInclusiveMaster(int nivel) {
        usuario.setNivel(nivel); var antes = estadoLote();
        when(lotes.findByIdAndUnidade(11, "RPMont")).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.registrarSaida(request("20"), usuario.getMatricula()));
        verify(lotes).findByIdAndUnidade(11, "RPMont"); verify(lotes, never()).findById(any());
        verify(lotes, never()).save(any()); verifyNoInteractions(movimentos, em, notificacoes, notificacaoService);
        assertEquals(antes, estadoLote());
    }
    static Stream<Arguments> quantidades() {
        return Stream.of(Arguments.of("0.01", 1, "19.99", 9), Arguments.of("20", 1, "0", 9),
                Arguments.of("20.01", 2, "19.99", 8), Arguments.of("200", 10, "0", 0));
    }
    @ParameterizedTest @MethodSource("quantidades")
    void preservaArredondamentoSobraESaldo(String kg, int unidades, String sobra, int saldo) {
        prepararGravacao(); var resposta = service.registrarSaida(request(kg), usuario.getMatricula());
        assertEquals(unidades, resposta.quantidadeUnidades()); assertEquals(saldo, resposta.saldoPosterior());
        assertEquals(0, new BigDecimal(sobra).compareTo(resposta.sobraCalculadaKg()));
        assertEquals(saldo == 0 ? SituacaoLoteFenoRacao.ESGOTADO : SituacaoLoteFenoRacao.ATIVO, lote.getSituacao());
    }
    @ParameterizedTest @ValueSource(strings = {"0", "-1"})
    void quantidadeInvalidaNaoConsultaLote(String kg) {
        assertThrows(BusinessException.class, () -> service.registrarSaida(request(kg), usuario.getMatricula()));
        verifyNoInteractions(lotes, movimentos, em);
    }
    @Test void requestQuantidadeLoteOuDataAusentesNaoConsultamLote() {
        for (var req : Arrays.asList(null,
                new RegistrarSaidaFenoRacaoRequestDTO(null, BigDecimal.ONE, LocalDate.now(), "s", "r", null, null),
                new RegistrarSaidaFenoRacaoRequestDTO(11, null, LocalDate.now(), "s", "r", null, null),
                new RegistrarSaidaFenoRacaoRequestDTO(11, BigDecimal.ONE, null, "s", "r", null, null))) {
            assertThrows(BusinessException.class, () -> service.registrarSaida(req, usuario.getMatricula()));
        }
        verifyNoInteractions(lotes, movimentos, em);
    }
    @Test void dataFuturaNaoConsultaLote() {
        var req = new RegistrarSaidaFenoRacaoRequestDTO(11, BigDecimal.ONE, LocalDate.now().plusDays(1), "s", "r", null, null);
        assertThrows(BusinessException.class, () -> service.registrarSaida(req, usuario.getMatricula()));
        verifyNoInteractions(lotes, movimentos, em);
    }
    @Test void saldoInsuficienteNaoAlteraLote() {
        prepararGravacao(); var antes = estadoLote();
        assertThrows(ConflictException.class, () -> service.registrarSaida(request("201"), usuario.getMatricula()));
        assertEquals(antes, estadoLote()); verify(lotes, never()).save(any()); verifyNoInteractions(movimentos, em);
    }
    @ParameterizedTest @ValueSource(strings = {"BLOQUEADO", "CANCELADO", "ESGOTADO", "VENCIDO"})
    void loteIndisponivelNaoGrava(String situacao) {
        lote.setSituacao(SituacaoLoteFenoRacao.valueOf(situacao)); prepararGravacao(); var antes = estadoLote();
        assertThrows(ConflictException.class, () -> service.registrarSaida(request("20"), usuario.getMatricula()));
        assertEquals(antes, estadoLote()); verify(lotes, never()).save(any()); verifyNoInteractions(movimentos, em);
    }
    @Test void loteSemSaldoNaoGrava() {
        lote.setQuantidadeAtual(0); prepararGravacao();
        assertThrows(ConflictException.class, () -> service.registrarSaida(request("20"), usuario.getMatricula()));
        verify(lotes, never()).save(any()); verifyNoInteractions(movimentos, em);
    }
    @Test void loteVencidoPreservaFluxoExistenteDeSinalizacaoSemCriarSaida() {
        lote.setValidade(LocalDate.now().minusDays(1)); prepararGravacao();
        assertThrows(ConflictException.class, () -> service.registrarSaida(request("20"), usuario.getMatricula()));
        assertEquals(SituacaoLoteFenoRacao.VENCIDO, lote.getSituacao());
        assertEquals(10, lote.getQuantidadeAtual()); verify(lotes).save(same(lote)); verifyNoInteractions(movimentos, em);
        // Chamada direta nao certifica rollback da sinalizacao; isso depende de integracao com banco.
    }
    @Test void ausenciaDeUsuarioNaoAcessaEstoque() {
        when(usuarios.findByMatricula(usuario.getMatricula())).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.registrarSaida(request("20"), usuario.getMatricula()));
        verifyNoInteractions(lotes, movimentos, em);
    }
    @Test void novaLeituraDeSetorImpedeReutilizarPermissaoAnterior() {
        prepararGravacao(); service.registrarSaida(request("20"), usuario.getMatricula());
        clearInvocations(lotes, movimentos, em, notificacoes, notificacaoService);
        usuario.setSetor("P4"); var antes = estadoLote();
        assertThrows(ForbiddenException.class, () -> service.registrarSaida(request("20"), usuario.getMatricula()));
        assertEquals(antes, estadoLote()); verify(usuarios, times(2)).findByMatricula(usuario.getMatricula());
        verifyNoInteractions(lotes, movimentos, em, notificacoes, notificacaoService);
    }
}
