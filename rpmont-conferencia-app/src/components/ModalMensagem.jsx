import {
  FaCircleCheck,
  FaCircleExclamation,
  FaCircleInfo,
  FaTriangleExclamation,
  FaXmark,
} from 'react-icons/fa6';

import '../styles/ModalMensagem.css';

const CONFIGURACOES = {
  sucesso: {
    tituloPadrao: 'Operação realizada',
    icone: FaCircleCheck,
  },
  erro: {
    tituloPadrao: 'Não foi possível concluir',
    icone: FaCircleExclamation,
  },
  aviso: {
    tituloPadrao: 'Atenção',
    icone: FaTriangleExclamation,
  },
  informacao: {
    tituloPadrao: 'Informação',
    icone: FaCircleInfo,
  },
};

function ModalMensagem({
  aberto,
  tipo = 'informacao',
  titulo,
  mensagem,
  textoBotao = 'Entendi',
  onFechar,
}) {
  if (!aberto) {
    return null;
  }

  const configuracao =
    CONFIGURACOES[tipo] ??
    CONFIGURACOES.informacao;

  const Icone = configuracao.icone;

  const fecharAoClicarFora = (event) => {
    if (event.target === event.currentTarget) {
      onFechar?.();
    }
  };

  return (
    <div
      className="modal-mensagem-overlay"
      onClick={fecharAoClicarFora}
      role="presentation"
    >
      <div
        className={`modal-mensagem-card modal-mensagem-${tipo}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-mensagem-titulo"
        aria-describedby="modal-mensagem-texto"
      >
        <button
          type="button"
          className="modal-mensagem-fechar"
          onClick={onFechar}
          aria-label="Fechar mensagem"
        >
          <FaXmark />
        </button>

        <div className="modal-mensagem-icone">
          <Icone />
        </div>

        <span className="modal-mensagem-subtitulo">
          Feno e Ração
        </span>

        <h2 id="modal-mensagem-titulo">
          {titulo || configuracao.tituloPadrao}
        </h2>

        <p id="modal-mensagem-texto">
          {mensagem || 'Não foi possível concluir a operação.'}
        </p>

        <button
          type="button"
          className="modal-mensagem-confirmar"
          onClick={onFechar}
        >
          {textoBotao}
        </button>
      </div>
    </div>
  );
}

export default ModalMensagem;