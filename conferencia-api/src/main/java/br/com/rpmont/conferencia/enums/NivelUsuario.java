package br.com.rpmont.conferencia.enums;

public enum NivelUsuario {

    ADMIN_MASTER(1),
    ADMIN(2),
    USUARIO_COMUM(3);

    private final Integer codigo;

    NivelUsuario(Integer codigo) {
        this.codigo = codigo;
    }

    public Integer getCodigo() {
        return codigo;
    }
}