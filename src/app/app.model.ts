export class Marca {
    nome!: string;
    codigo!: string;
}

export class Modelo {
    modelos!: ModeloAno[];
    anos!: ModeloAno[];
}

export class ModeloAno {
    nome!: string;
    codigo!: string;
}

export class ResultadoFipe {
    Valor!: string;
    Marca!: string;
    Modelo!: string;
    AnoModelo!: string;
    Combustivel!: string;
    CodigoFipe!: string;
    MesReferencia!: string;
    TipoVeiculo!: number;
    SiglaCombustivel!: string;
}

export class TaxaJuros {
    Posicao!: number;
    InstituicaoFinanceira!: string;
    TaxaJurosAoMes!: string;
    TaxaJurosAoAno!: string;
}

export class ResultadoTaxaJuros {
    conteudo!: TaxaJuros[];
}

export class PeriodoDisponivel {
    inicioPeriodo!: string;
    fimPeriodo!: string;
}

export class PeriodosDisponiveis {
    "@odata.context"!: string;
    value!: PeriodoDisponivel[];
}
