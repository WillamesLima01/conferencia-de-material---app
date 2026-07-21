package br.com.rpmont.conferencia.specification;

import br.com.rpmont.conferencia.dtos.MovimentacaoMaterialFiltroDTO;
import br.com.rpmont.conferencia.model.MaterialPatrimonial;
import br.com.rpmont.conferencia.model.MovimentacaoMaterial;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class MovimentacaoMaterialSpecification {

    private MovimentacaoMaterialSpecification() {
    }

    public static Specification<MovimentacaoMaterial> comFiltros(
            MovimentacaoMaterialFiltroDTO filtro
    ) {
        return (root, query, criteriaBuilder) -> {

            List<Predicate> predicates = new ArrayList<>();

            Join<MovimentacaoMaterial, MaterialPatrimonial> materialJoin =
                    null;

            if (filtro == null) {
                return criteriaBuilder.conjunction();
            }

            if (filtro.dataInicial() != null) {
                LocalDateTime inicio =
                        filtro.dataInicial().atStartOfDay();

                predicates.add(
                        criteriaBuilder.greaterThanOrEqualTo(
                                root.get("dataMovimentacao"),
                                inicio
                        )
                );
            }

            if (filtro.dataFinal() != null) {
                LocalDateTime fimExclusivo =
                        filtro.dataFinal()
                                .plusDays(1)
                                .atStartOfDay();

                predicates.add(
                        criteriaBuilder.lessThan(
                                root.get("dataMovimentacao"),
                                fimExclusivo
                        )
                );
            }

            if (filtro.tipoMovimentacao() != null) {
                predicates.add(
                        criteriaBuilder.equal(
                                root.get("tipoMovimentacao"),
                                filtro.tipoMovimentacao()
                        )
                );
            }

            if (filtro.materialId() != null) {
                predicates.add(
                        criteriaBuilder.equal(
                                root.get("materialId"),
                                filtro.materialId()
                        )
                );
            }

            if (filtro.usuarioId() != null) {
                predicates.add(
                        criteriaBuilder.equal(
                                root.get("usuarioId"),
                                filtro.usuarioId()
                        )
                );
            }

            if (filtro.situacaoAnterior() != null) {
                predicates.add(
                        criteriaBuilder.equal(
                                root.get("situacaoAnterior"),
                                filtro.situacaoAnterior()
                        )
                );
            }

            if (filtro.situacaoNova() != null) {
                predicates.add(
                        criteriaBuilder.equal(
                                root.get("situacaoNova"),
                                filtro.situacaoNova()
                        )
                );
            }

            if (temTexto(filtro.numeroDocumento())) {
                predicates.add(
                        contemIgnorandoMaiusculas(
                                criteriaBuilder,
                                root.get("numeroDocumento"),
                                filtro.numeroDocumento()
                        )
                );
            }

            if (temTexto(filtro.setor())) {
                String setor = prepararTexto(filtro.setor());

                Predicate setorOrigem =
                        criteriaBuilder.like(
                                criteriaBuilder.lower(
                                        root.get("setorOrigem")
                                ),
                                setor
                        );

                Predicate setorDestino =
                        criteriaBuilder.like(
                                criteriaBuilder.lower(
                                        root.get("setorDestino")
                                ),
                                setor
                        );

                predicates.add(
                        criteriaBuilder.or(
                                setorOrigem,
                                setorDestino
                        )
                );
            }

            if (temTexto(filtro.unidade())) {
                String unidade =
                        prepararTexto(filtro.unidade());

                Predicate unidadeOrigem =
                        criteriaBuilder.like(
                                criteriaBuilder.lower(
                                        root.get("unidadeOrigem")
                                ),
                                unidade
                        );

                Predicate unidadeDestino =
                        criteriaBuilder.like(
                                criteriaBuilder.lower(
                                        root.get("unidadeDestino")
                                ),
                                unidade
                        );

                predicates.add(
                        criteriaBuilder.or(
                                unidadeOrigem,
                                unidadeDestino
                        )
                );
            }

            boolean possuiFiltroMaterial =
                    temTexto(filtro.numeroSerie()) ||
                            temTexto(filtro.nome()) ||
                            temTexto(filtro.marca()) ||
                            temTexto(filtro.descricao());

            if (possuiFiltroMaterial) {
                materialJoin = root.join(
                        "material",
                        JoinType.INNER
                );
            }

            if (temTexto(filtro.numeroSerie())) {
                predicates.add(
                        contemIgnorandoMaiusculas(
                                criteriaBuilder,
                                materialJoin.get("numeroSerie"),
                                filtro.numeroSerie()
                        )
                );
            }

            if (temTexto(filtro.nome())) {
                predicates.add(
                        contemIgnorandoMaiusculas(
                                criteriaBuilder,
                                materialJoin.get("nome"),
                                filtro.nome()
                        )
                );
            }

            if (temTexto(filtro.marca())) {
                predicates.add(
                        contemIgnorandoMaiusculas(
                                criteriaBuilder,
                                materialJoin.get("marca"),
                                filtro.marca()
                        )
                );
            }

            if (temTexto(filtro.descricao())) {
                predicates.add(
                        contemIgnorandoMaiusculas(
                                criteriaBuilder,
                                materialJoin.get("descricao"),
                                filtro.descricao()
                        )
                );
            }

            query.distinct(true);

            return criteriaBuilder.and(
                    predicates.toArray(
                            new Predicate[0]
                    )
            );
        };
    }

    private static boolean temTexto(String valor) {
        return valor != null &&
                !valor.trim().isEmpty();
    }

    private static String prepararTexto(
            String valor
    ) {
        return "%" +
                valor.trim()
                        .toLowerCase(Locale.ROOT) +
                "%";
    }

    private static Predicate contemIgnorandoMaiusculas(
            jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
            jakarta.persistence.criteria.Expression<String> campo,
            String valor
    ) {
        return criteriaBuilder.like(
                criteriaBuilder.lower(campo),
                prepararTexto(valor)
        );
    }
}