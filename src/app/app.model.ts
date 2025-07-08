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

export interface SimulacaoHistorico {
    id: string;
    data: string;
    valorTotal: string;
    entrada: string;
    parcelaResidual: string;
    numParcelas: number;
    taxaJuros: number;
    parcelaTotal: string;
    valorFinanciado: number;
    totalJuros: number;
    totalPago: number;
    instituicaoFinanceira?: string;
    marca?: string;
    modelo?: string;
    ano?: string;
    valorFipe?: string;
    // Novos campos para informações detalhadas
    nomeLoja?: string;
    observacoes?: string;
    situacaoCarro?: string;
    quilometragem?: string;
    cor?: string;
    combustivel?: string;
    cambio?: string;
    anoFabricacao?: string;
    anoModelo?: string;
    placa?: string;
    chassi?: string;
    renavam?: string;
}
