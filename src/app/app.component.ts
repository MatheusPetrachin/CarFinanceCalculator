import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Marca, ModeloAno, ResultadoFipe, SimulacaoHistorico, TaxaJuros } from './app.model';
import { AppService } from './app.services';

interface ResultadoCalculo {
  parcelaMensal: number;
  valorFinanciado: number;
  totalJuros: number;
  totalPago: number;
  taxaMensal: number;
  numParcelas: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  providers: [CurrencyPipe],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    MatTableModule
  ]
})
export class AppComponent implements OnInit {
  @ViewChild('valorTotal') valorTotal!: ElementRef<HTMLInputElement>;
  @ViewChild('entrada') entrada!: ElementRef<HTMLInputElement>;
  @ViewChild('parcelaResidual') parcelaResidual!: ElementRef<HTMLInputElement>;
  @ViewChild('numParcelas') numParcelas!: ElementRef<HTMLInputElement>;
  @ViewChild('taxaJuros') taxaJuros!: ElementRef<HTMLInputElement>;
  @ViewChild('parcelaAlvo') parcelaAlvo!: ElementRef<HTMLInputElement>;

  @ViewChild('nomeLoja') nomeLoja?: ElementRef<HTMLInputElement>;
  @ViewChild('quilometragem') quilometragem?: ElementRef<HTMLInputElement>;
  @ViewChild('cor') cor?: ElementRef<HTMLInputElement>;
  @ViewChild('anoFabricacao') anoFabricacao?: ElementRef<HTMLInputElement>;
  @ViewChild('anoModelo') anoModelo?: ElementRef<HTMLInputElement>;
  @ViewChild('placa') placa?: ElementRef<HTMLInputElement>;
  @ViewChild('renavam') renavam?: ElementRef<HTMLInputElement>;
  @ViewChild('observacoes') observacoes?: ElementRef<HTMLTextAreaElement>;

  marcas: Marca[] = [];
  modelos: ModeloAno[] = [];
  anos: ModeloAno[] = [];
  resultadoFipe?: ResultadoFipe;
  resultadoCalculo?: ResultadoCalculo;
  taxasJuros: TaxaJuros[] = [];

  carregandoConsulta = false;
  carregandoTaxas = false;
  erroConsulta = '';
  erroTaxas = '';
  mensagemErro = '';

  codigoVeiculo = '';
  codigoMarca = '';
  codigoModelo = '';
  codigoAno = '';
  valorFIPE = '';

  simulacoesHistorico: SimulacaoHistorico[] = [];
  mostrarHistorico = false;
  detalhesVeiculoAbertos = false;
  colunasHistorico: string[] = [
    'data',
    'carro',
    'valorTotal',
    'parcelaTotal',
    'numParcelas',
    'taxaJuros',
    'banco',
    'acoes'
  ];

  situacaoCarroControl = new FormControl('');
  combustivelControl = new FormControl('');
  cambioControl = new FormControl('');
  veiculoControl = new FormControl('');
  marcaControl = new FormControl('');
  modeloControl = new FormControl('');
  anoControl = new FormControl('');
  bancoControl = new FormControl('');

  constructor(
    private readonly appService: AppService,
    private readonly currencyPipe: CurrencyPipe
  ) {}

  ngOnInit(): void {
    this.getTaxasJuros();
    this.carregarHistorico();
  }

  onCurrencyInput(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    input.value = this.formatarMoedaDigitada(input.value);
    this.resultadoCalculo = undefined;
    this.mensagemErro = '';
  }

  getMarcas(value: string, preservarCalculo = false): void {
    this.codigoVeiculo = value;
    this.codigoMarca = '';
    this.codigoModelo = '';
    this.codigoAno = '';
    this.marcaControl.setValue('');
    this.modeloControl.setValue('');
    this.anoControl.setValue('');
    this.marcas = [];
    this.modelos = [];
    this.anos = [];
    this.limparResultadoFipe(preservarCalculo);
    this.iniciarConsulta();

    this.appService.getMarcas(value).subscribe({
      next: data => {
        this.marcas = data;
        this.carregandoConsulta = false;
      },
      error: () => this.falharConsulta()
    });
  }

  getModelos(value: string, preservarCalculo = false): void {
    this.codigoMarca = value;
    this.codigoModelo = '';
    this.codigoAno = '';
    this.modeloControl.setValue('');
    this.anoControl.setValue('');
    this.modelos = [];
    this.anos = [];
    this.limparResultadoFipe(preservarCalculo);

    if (!this.codigoVeiculo) {
      return;
    }

    this.iniciarConsulta();
    this.appService.getModelos(this.codigoVeiculo, value).subscribe({
      next: data => {
        this.modelos = data.modelos ?? [];
        this.carregandoConsulta = false;
      },
      error: () => this.falharConsulta()
    });
  }

  getAnos(value: string, preservarCalculo = false): void {
    this.codigoModelo = value;
    this.codigoAno = '';
    this.anoControl.setValue('');
    this.anos = [];
    this.limparResultadoFipe(preservarCalculo);

    if (!this.codigoVeiculo || !this.codigoMarca) {
      return;
    }

    this.iniciarConsulta();
    this.appService.getAnos(this.codigoVeiculo, this.codigoMarca, value).subscribe({
      next: data => {
        this.anos = data;
        this.carregandoConsulta = false;
      },
      error: () => this.falharConsulta()
    });
  }

  getResultado(value: string, preservarCalculo = false): void {
    this.codigoAno = value;
    if (!this.codigoVeiculo || !this.codigoMarca || !this.codigoModelo) {
      return;
    }

    this.iniciarConsulta();
    this.appService
      .getResultado(this.codigoVeiculo, this.codigoMarca, this.codigoModelo, value)
      .subscribe({
        next: data => {
          this.resultadoFipe = data;
          this.valorFIPE = data.Valor ?? '';
          if (!preservarCalculo) {
            this.resultadoCalculo = undefined;
          }
          this.carregandoConsulta = false;
        },
        error: () => this.falharConsulta()
      });
  }

  getTaxasJuros(): void {
    this.carregandoTaxas = true;
    this.erroTaxas = '';

    this.appService.getTaxasJuros().subscribe({
      next: data => {
        this.taxasJuros = data.conteudo ?? [];
        this.carregandoTaxas = false;

        if (!this.taxasJuros.length) {
          this.erroTaxas = 'Nenhuma taxa foi encontrada. Você ainda pode informar uma taxa manualmente.';
        }
      },
      error: () => {
        this.carregandoTaxas = false;
        this.erroTaxas = 'Taxas indisponíveis no momento. Informe a taxa da sua proposta manualmente.';
      }
    });
  }

  selecionarTaxaJuros(posicaoTaxa: string): void {
    const taxa = this.taxasJuros.find(item => item.Posicao === Number(posicaoTaxa));
    if (!taxa) {
      return;
    }

    const taxaNumerica = Number(taxa.TaxaJurosAoMes.replace(',', '.'));
    this.taxaJuros.nativeElement.value = taxaNumerica.toFixed(2);
    this.resultadoCalculo = undefined;
    this.mensagemErro = '';
  }

  calcular(): void {
    this.mensagemErro = '';

    const valorTotal = this.parseCurrency(this.valorTotal.nativeElement.value);
    const entrada = this.parseCurrency(this.entrada.nativeElement.value);
    const parcelaResidual = this.parseCurrency(this.parcelaResidual.nativeElement.value);
    const parcelas = Number(this.numParcelas.nativeElement.value);
    const taxaTexto = this.taxaJuros.nativeElement.value.trim().replace(',', '.');
    const taxaFoiInformada = taxaTexto !== '';
    let taxaMensal = Number(taxaTexto);
    const parcelaAlvo = this.parseCurrency(this.parcelaAlvo.nativeElement.value);

    if (!Number.isFinite(valorTotal) || valorTotal <= 0) {
      this.mensagemErro = 'Informe um valor válido para o veículo.';
      return;
    }

    if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 100) {
      this.mensagemErro = 'Escolha um prazo entre 1 e 100 parcelas.';
      return;
    }

    const valorFinanciado = valorTotal - entrada - parcelaResidual;
    if (valorFinanciado <= 0) {
      this.mensagemErro = 'A soma da entrada e da parcela residual deve ser menor que o valor do veículo.';
      return;
    }

    let parcelaMensal: number;

    if (taxaFoiInformada) {
      if (!Number.isFinite(taxaMensal) || taxaMensal < 0 || taxaMensal > 100) {
        this.mensagemErro = 'Informe uma taxa mensal válida entre 0% e 100%.';
        return;
      }

      parcelaMensal = this.calcularParcela(valorFinanciado, parcelas, taxaMensal / 100);
    } else if (parcelaAlvo > 0) {
      const taxaCalculada = this.calcularTaxaJuros(valorFinanciado, parcelas, parcelaAlvo);
      if (taxaCalculada === null) {
        this.mensagemErro = 'A parcela alvo é menor que o valor mínimo sem juros para esse prazo.';
        return;
      }

      taxaMensal = taxaCalculada;
      parcelaMensal = parcelaAlvo;
      this.taxaJuros.nativeElement.value = taxaMensal.toFixed(4);
    } else {
      this.mensagemErro = 'Informe a taxa mensal ou uma parcela alvo para continuar.';
      return;
    }

    const totalParcelas = parcelaMensal * parcelas;
    const totalJuros = Math.max(0, totalParcelas - valorFinanciado);
    const totalPago = entrada + parcelaResidual + totalParcelas;

    this.parcelaAlvo.nativeElement.value = this.formatarMoeda(parcelaMensal);
    this.resultadoCalculo = {
      parcelaMensal,
      valorFinanciado,
      totalJuros,
      totalPago,
      taxaMensal,
      numParcelas: parcelas
    };

    this.salvarSimulacaoNoHistorico();
  }

  calcularTaxaJuros(
    valorFinanciado: number,
    numParcelas: number,
    valorDaParcela: number
  ): number | null {
    const parcelaSemJuros = valorFinanciado / numParcelas;
    if (valorDaParcela < parcelaSemJuros - 0.005) {
      return null;
    }

    if (Math.abs(valorDaParcela - parcelaSemJuros) < 0.005) {
      return 0;
    }

    let minimo = 0;
    let maximo = 1;

    for (let iteracao = 0; iteracao < 120; iteracao++) {
      const meio = (minimo + maximo) / 2;
      const parcelaCalculada = this.calcularParcela(valorFinanciado, numParcelas, meio);

      if (Math.abs(parcelaCalculada - valorDaParcela) < 0.0001) {
        return meio * 100;
      }

      if (parcelaCalculada > valorDaParcela) {
        maximo = meio;
      } else {
        minimo = meio;
      }
    }

    return ((minimo + maximo) / 2) * 100;
  }

  alternarDetalhesVeiculo(): void {
    this.detalhesVeiculoAbertos = !this.detalhesVeiculoAbertos;
  }

  carregarHistorico(): void {
    this.simulacoesHistorico = this.appService.obterSimulacoes();
  }

  salvarSimulacaoNoHistorico(): void {
    if (!this.resultadoCalculo) {
      return;
    }

    const entrada = this.entrada.nativeElement.value || this.formatarMoeda(0);
    const parcelaResidual = this.parcelaResidual.nativeElement.value || this.formatarMoeda(0);
    const simulacao: Omit<SimulacaoHistorico, 'id' | 'data'> = {
      valorTotal: this.valorTotal.nativeElement.value,
      entrada,
      parcelaResidual,
      numParcelas: this.resultadoCalculo.numParcelas,
      taxaJuros: this.resultadoCalculo.taxaMensal,
      parcelaTotal: this.formatarMoeda(this.resultadoCalculo.parcelaMensal),
      valorFinanciado: this.resultadoCalculo.valorFinanciado,
      totalJuros: this.resultadoCalculo.totalJuros,
      totalPago: this.resultadoCalculo.totalPago,
      instituicaoFinanceira: this.obterInstituicaoSelecionada(),
      marca: this.obterMarcaSelecionada(),
      modelo: this.obterModeloSelecionado(),
      ano: this.obterAnoSelecionado(),
      valorFipe: this.valorFIPE,
      nomeLoja: this.nomeLoja?.nativeElement.value ?? '',
      observacoes: this.observacoes?.nativeElement.value ?? '',
      situacaoCarro: this.situacaoCarroControl.value ?? '',
      quilometragem: this.quilometragem?.nativeElement.value ?? '',
      cor: this.cor?.nativeElement.value ?? '',
      combustivel: this.combustivelControl.value ?? '',
      cambio: this.cambioControl.value ?? '',
      anoFabricacao: this.anoFabricacao?.nativeElement.value ?? '',
      anoModelo: this.anoModelo?.nativeElement.value ?? '',
      placa: this.placa?.nativeElement.value ?? '',
      renavam: this.renavam?.nativeElement.value ?? '',
      codigoVeiculo: this.codigoVeiculo,
      codigoMarca: this.codigoMarca,
      codigoModelo: this.codigoModelo,
      codigoAno: this.codigoAno,
      mesReferenciaFipe: this.resultadoFipe?.MesReferencia ?? '',
      combustivelFipe: this.resultadoFipe?.Combustivel ?? '',
      siglaCombustivelFipe: this.resultadoFipe?.SiglaCombustivel ?? '',
      taxaJurosAoMes: this.obterTaxaJurosAoMes(),
      taxaJurosAoAno: this.obterTaxaJurosAoAno(),
      posicaoTaxa: this.obterPosicaoTaxa()
    };

    this.appService.salvarSimulacao(simulacao);
    this.carregarHistorico();
  }

  deletarSimulacao(id: string): void {
    const confirmou = window.confirm('Excluir esta simulação do histórico?');
    if (!confirmou) {
      return;
    }

    this.appService.deletarSimulacao(id);
    this.carregarHistorico();
  }

  carregarSimulacao(simulacao: SimulacaoHistorico): void {
    this.valorTotal.nativeElement.value = simulacao.valorTotal;
    this.entrada.nativeElement.value = simulacao.entrada;
    this.parcelaResidual.nativeElement.value = simulacao.parcelaResidual;
    this.numParcelas.nativeElement.value = simulacao.numParcelas.toString();
    this.taxaJuros.nativeElement.value = simulacao.taxaJuros.toString();
    this.parcelaAlvo.nativeElement.value = simulacao.parcelaTotal;

    const entrada = this.parseCurrency(simulacao.entrada);
    const residual = this.parseCurrency(simulacao.parcelaResidual);
    const parcela = this.parseCurrency(simulacao.parcelaTotal);
    this.resultadoCalculo = {
      parcelaMensal: parcela,
      valorFinanciado: simulacao.valorFinanciado,
      totalJuros: simulacao.totalJuros,
      totalPago: entrada + residual + parcela * simulacao.numParcelas,
      taxaMensal: simulacao.taxaJuros,
      numParcelas: simulacao.numParcelas
    };

    this.valorFIPE = simulacao.valorFipe ?? '';
    this.restaurarSelecoes(simulacao);

    const possuiDetalhes = Boolean(
      simulacao.nomeLoja ||
      simulacao.observacoes ||
      simulacao.situacaoCarro ||
      simulacao.quilometragem ||
      simulacao.cor ||
      simulacao.combustivel ||
      simulacao.cambio ||
      simulacao.placa ||
      simulacao.renavam
    );

    this.detalhesVeiculoAbertos = possuiDetalhes;
    this.situacaoCarroControl.setValue(simulacao.situacaoCarro ?? '');
    this.combustivelControl.setValue(simulacao.combustivel ?? '');
    this.cambioControl.setValue(simulacao.cambio ?? '');

    if (possuiDetalhes) {
      setTimeout(() => this.preencherDetalhes(simulacao));
    }

    this.fecharHistorico();
  }

  alternarHistorico(): void {
    this.mostrarHistorico = !this.mostrarHistorico;
  }

  fecharHistorico(): void {
    this.mostrarHistorico = false;
  }

  onHistoricoClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.fecharHistorico();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.mostrarHistorico) {
      this.fecharHistorico();
    }
  }

  formatarData(data: string): string {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatarInfoCarro(simulacao: SimulacaoHistorico): string {
    const partes = [simulacao.marca, simulacao.modelo, simulacao.ano].filter(Boolean);
    if (partes.length) {
      return partes.join(' ');
    }

    return simulacao.valorFipe ? `Veículo — ${simulacao.valorFipe}` : 'Simulação sem veículo';
  }

  limparTela(): void {
    this.valorTotal.nativeElement.value = '';
    this.entrada.nativeElement.value = '';
    this.parcelaResidual.nativeElement.value = '';
    this.numParcelas.nativeElement.value = '36';
    this.taxaJuros.nativeElement.value = '';
    this.parcelaAlvo.nativeElement.value = '';

    this.valorFIPE = '';
    this.resultadoFipe = undefined;
    this.resultadoCalculo = undefined;
    this.mensagemErro = '';
    this.erroConsulta = '';
    this.codigoVeiculo = '';
    this.codigoMarca = '';
    this.codigoModelo = '';
    this.codigoAno = '';
    this.marcas = [];
    this.modelos = [];
    this.anos = [];

    this.veiculoControl.setValue('');
    this.marcaControl.setValue('');
    this.modeloControl.setValue('');
    this.anoControl.setValue('');
    this.bancoControl.setValue('');
    this.situacaoCarroControl.setValue('');
    this.combustivelControl.setValue('');
    this.cambioControl.setValue('');

    if (this.nomeLoja) this.nomeLoja.nativeElement.value = '';
    if (this.observacoes) this.observacoes.nativeElement.value = '';
    if (this.quilometragem) this.quilometragem.nativeElement.value = '';
    if (this.cor) this.cor.nativeElement.value = '';
    if (this.anoFabricacao) this.anoFabricacao.nativeElement.value = '';
    if (this.anoModelo) this.anoModelo.nativeElement.value = '';
    if (this.placa) this.placa.nativeElement.value = '';
    if (this.renavam) this.renavam.nativeElement.value = '';
  }

  private calcularParcela(valorFinanciado: number, parcelas: number, taxaDecimal: number): number {
    if (taxaDecimal === 0) {
      return valorFinanciado / parcelas;
    }

    return (valorFinanciado * taxaDecimal) / (1 - Math.pow(1 + taxaDecimal, -parcelas));
  }

  private formatarMoedaDigitada(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (!digits) {
      return '';
    }

    return this.formatarMoeda(Number(digits) / 100);
  }

  private formatarMoeda(value: number): string {
    return this.currencyPipe.transform(value, 'BRL', 'symbol', '1.2-2') ?? '';
  }

  private parseCurrency(value: string): number {
    if (!value) {
      return 0;
    }

    const normalizado = value
      .replace(/R\$\s?/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim();
    const numero = Number(normalizado);
    return Number.isFinite(numero) ? numero : 0;
  }

  private iniciarConsulta(): void {
    this.carregandoConsulta = true;
    this.erroConsulta = '';
  }

  private falharConsulta(): void {
    this.carregandoConsulta = false;
    this.erroConsulta = 'Não foi possível consultar a FIPE agora. Tente novamente em instantes.';
  }

  private limparResultadoFipe(preservarCalculo = false): void {
    this.resultadoFipe = undefined;
    if (!preservarCalculo) {
      this.valorFIPE = '';
      this.resultadoCalculo = undefined;
    }
  }

  private obterInstituicaoSelecionada(): string {
    return this.obterTaxaSelecionada()?.InstituicaoFinanceira ?? '';
  }

  private obterMarcaSelecionada(): string {
    return this.marcas.find(marca => marca.codigo === this.codigoMarca)?.nome ?? '';
  }

  private obterModeloSelecionado(): string {
    return this.modelos.find(modelo => modelo.codigo === this.codigoModelo)?.nome ?? '';
  }

  private obterAnoSelecionado(): string {
    return this.anos.find(ano => ano.codigo === this.codigoAno)?.nome ?? '';
  }

  private obterTaxaJurosAoMes(): string {
    return this.obterTaxaSelecionada()?.TaxaJurosAoMes ?? '';
  }

  private obterTaxaJurosAoAno(): string {
    return this.obterTaxaSelecionada()?.TaxaJurosAoAno ?? '';
  }

  private obterPosicaoTaxa(): number {
    return this.obterTaxaSelecionada()?.Posicao ?? 0;
  }

  private obterTaxaSelecionada(): TaxaJuros | undefined {
    const posicao = Number(this.bancoControl.value);
    return this.taxasJuros.find(taxa => taxa.Posicao === posicao);
  }

  private restaurarSelecoes(simulacao: SimulacaoHistorico): void {
    if (simulacao.codigoVeiculo) {
      this.codigoVeiculo = simulacao.codigoVeiculo;
      this.veiculoControl.setValue(simulacao.codigoVeiculo);
      this.getMarcas(simulacao.codigoVeiculo, true);
    }

    if (simulacao.codigoMarca) {
      setTimeout(() => {
        this.codigoMarca = simulacao.codigoMarca ?? '';
        this.marcaControl.setValue(simulacao.codigoMarca ?? '');
        this.getModelos(simulacao.codigoMarca ?? '', true);
      }, 350);
    }

    if (simulacao.codigoModelo) {
      setTimeout(() => {
        this.codigoModelo = simulacao.codigoModelo ?? '';
        this.modeloControl.setValue(simulacao.codigoModelo ?? '');
        this.getAnos(simulacao.codigoModelo ?? '', true);
      }, 700);
    }

    if (simulacao.codigoAno) {
      setTimeout(() => {
        this.codigoAno = simulacao.codigoAno ?? '';
        this.anoControl.setValue(simulacao.codigoAno ?? '');
        this.getResultado(simulacao.codigoAno ?? '', true);
      }, 1050);
    }

    if (simulacao.posicaoTaxa) {
      this.bancoControl.setValue(simulacao.posicaoTaxa.toString());
    }
  }

  private preencherDetalhes(simulacao: SimulacaoHistorico): void {
    if (this.nomeLoja) this.nomeLoja.nativeElement.value = simulacao.nomeLoja ?? '';
    if (this.observacoes) this.observacoes.nativeElement.value = simulacao.observacoes ?? '';
    if (this.quilometragem) this.quilometragem.nativeElement.value = simulacao.quilometragem ?? '';
    if (this.cor) this.cor.nativeElement.value = simulacao.cor ?? '';
    if (this.anoFabricacao) this.anoFabricacao.nativeElement.value = simulacao.anoFabricacao ?? '';
    if (this.anoModelo) this.anoModelo.nativeElement.value = simulacao.anoModelo ?? '';
    if (this.placa) this.placa.nativeElement.value = simulacao.placa ?? '';
    if (this.renavam) this.renavam.nativeElement.value = simulacao.renavam ?? '';
  }
}
