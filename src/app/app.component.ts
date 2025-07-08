import { ElementRef, HostListener } from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Marca, Modelo, ModeloAno, ResultadoFipe, TaxaJuros, ResultadoTaxaJuros, SimulacaoHistorico } from './app.model';
import { AppService } from './app.services';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { HttpClientModule } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  providers: [CurrencyPipe],
  animations: [
    trigger('slideInOut', [
      state('expanded', style({
        height: '*',
        opacity: 1,
        overflow: 'hidden'
      })),
      state('collapsed', style({
        height: '0px',
        opacity: 0,
        overflow: 'hidden'
      })),
      transition('expanded <=> collapsed', [
        animate('300ms ease-in-out')
      ])
    ])
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatOptionModule,
    HttpClientModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule
  ]
})
export class AppComponent implements OnInit {

  @ViewChild("valorTotal") valorTotal!: ElementRef;
  @ViewChild("entrada") entrada!: ElementRef;
  @ViewChild("parcelaResidual") parcelaResidual!: ElementRef;
  @ViewChild("numParcelas") numParcelas!: ElementRef;
  @ViewChild("taxaJuros") taxaJuros!: ElementRef;
  @ViewChild("parcelaTotal") parcelaTotal!: ElementRef;
  
  // Novos campos para informações do carro
  @ViewChild("nomeLoja") nomeLoja!: ElementRef;
  @ViewChild("quilometragem") quilometragem!: ElementRef;
  @ViewChild("cor") cor!: ElementRef;
  @ViewChild("anoFabricacao") anoFabricacao!: ElementRef;
  @ViewChild("anoModelo") anoModelo!: ElementRef;
  @ViewChild("placa") placa!: ElementRef;
  @ViewChild("renavam") renavam!: ElementRef;
  @ViewChild("observacoes") observacoes!: ElementRef;

  myForm: FormBuilder | undefined;

  marcas: Marca[] = [];
  modelos: ModeloAno[] = [];
  anos: ModeloAno[] = [];
  resultadoFipe: ResultadoFipe | undefined;
  taxasJuros: TaxaJuros[] = [];
  dataTaxasJuros: string = '';
  carregandoTaxas: boolean = false;

  codigoVeiculo: string = '';
  codigoMarca: string = '';
  codigoModelo: string = '';
  codigoAno: string = '';
  parcelaTotalResult: string = '';
  valorFIPE: string = '';

  // Propriedades para histórico
  simulacoesHistorico: SimulacaoHistorico[] = [];
  mostrarHistorico: boolean = false;
  colunasHistorico: string[] = ['data', 'carro', 'valorTotal', 'parcelaTotal', 'numParcelas', 'taxaJuros', 'banco', 'acoes'];
  
  // Propriedades para collapse dos cards
  cardFipeCollapsed: boolean = false;
  cardCalculadoraCollapsed: boolean = false;
  
  // FormControls para os selects
  situacaoCarroControl = new FormControl('');
  combustivelControl = new FormControl('');
  cambioControl = new FormControl('');
  
  // FormControls para FIPE e banco
  veiculoControl = new FormControl('');
  marcaControl = new FormControl('');
  modeloControl = new FormControl('');
  anoControl = new FormControl('');
  bancoControl = new FormControl('');

  constructor(private appService: AppService, private currencyPipe: CurrencyPipe) { }

  onInput(event: any) {
    event.target.value = this.currencyFormatter(event.target.value);
  }

  currencyFormatter(value: any) {
    return this.currencyPipe.transform((parseFloat(value.replace(/\D/g, '')) / 100).toFixed(2), 'BRL', 'symbol', '1.2-2');
  }

  ngOnInit(): void {
    this.getTaxasJuros();
    this.carregarHistorico();
  }

  getMarcas(value: string) {
    this.codigoVeiculo = value;
    this.appService.getMarcas(this.codigoVeiculo).subscribe(data => { this.marcas = data });
  }

  getModelos(value: string) {
    this.codigoMarca = value;
    if (this.codigoVeiculo && this.codigoMarca) {
      this.appService.getModelos(this.codigoVeiculo, this.codigoMarca).subscribe(data => {
        this.modelos = data.modelos || [];
      });
    }
  }

  getAnos(value: string) {
    this.codigoModelo = value;
    if (this.codigoVeiculo && this.codigoMarca && this.codigoModelo) {
      this.appService.getAnos(this.codigoVeiculo, this.codigoMarca, this.codigoModelo).subscribe(data => {
        this.anos = data;
      });
    }
  }

  getResultado(value: string) {
    this.codigoAno = value;
    if (this.codigoVeiculo && this.codigoMarca && this.codigoModelo && this.codigoAno) {
      this.appService.getResultado(this.codigoVeiculo, this.codigoMarca, this.codigoModelo, this.codigoAno).subscribe(data => {
        this.resultadoFipe = data;
        this.valorFIPE = this.resultadoFipe?.Valor || '';
      });
    }
  }

  getTaxasJuros() {
    this.carregandoTaxas = true;
    this.appService.getTaxasJuros().subscribe(
      data => {
        this.taxasJuros = data.conteudo;
        this.carregandoTaxas = false;
      },
      error => {
        console.error('Erro ao carregar taxas de juros:', error);
        this.carregandoTaxas = false;
        // Fallback: usar uma data conhecida que funciona
        this.getTaxasJurosFallback();
      }
    );
  }

  getTaxasJurosFallback() {
    this.appService.getTaxasJurosFallback().subscribe(
      data => {
        this.taxasJuros = data.conteudo;
        this.dataTaxasJuros = '2025-06-06 (fallback)';
      },
      error => {
        console.error('Erro no fallback também:', error);
      }
    );
  }

  selecionarTaxaJuros(posicaoTaxa: string) {
    // Encontrar a taxa pelo posição
    const taxa = this.taxasJuros.find(t => t.Posicao === parseInt(posicaoTaxa));
    if (taxa) {
      // Converte a taxa de juros ao mês para número e define no campo
      const taxaNumerica = parseFloat(taxa.TaxaJurosAoMes.replace(',', '.'));
      this.taxaJuros.nativeElement.value = taxaNumerica.toFixed(2);
      // Removido o clearParcelaIdeal() para não limpar a parcela automaticamente
    }
  }

  calcular() {

    var valorTotal = this.valorTotal.nativeElement.value.replace(/R\$\s?/g, "").replace(/\./g, "").replace(",", ".");
    var entrada = this.entrada.nativeElement.value.replace(/R\$\s?/g, "").replace(/\./g, "").replace(",", ".");
    var parcelaResidual = this.parcelaResidual.nativeElement.value.replace(/R\$\s?/g, "").replace(/\./g, "").replace(",", ".");

    var numParcelas = parseFloat(this.numParcelas.nativeElement.value);
    var taxaJuros = this.taxaJuros.nativeElement.value / 100;
    var valorFinanciado = valorTotal - entrada - parcelaResidual;
    var parcelaTotal = parseFloat(this.parcelaTotal.nativeElement.value.replace(/R\$\s?/g, "").replace(/\./g, "").replace(",", "."));

    if (parcelaTotal) {
      this.taxaJuros.nativeElement.value = this.calcularTaxaJuros(valorFinanciado, numParcelas, parcelaTotal);
    }
    else if (taxaJuros) {
      const value = (valorFinanciado * taxaJuros) / (1 - Math.pow(1 + taxaJuros, -numParcelas));

      // Garantir que value seja numérico e corretamente formatado
      this.parcelaTotal.nativeElement.value = this.currencyPipe.transform(
        value,
        'BRL',
        'symbol',
        '1.2-2'
      );

    }

    // Salvar simulação no histórico se houver dados válidos
    if (valorTotal && numParcelas && taxaJuros) {
      this.salvarSimulacaoNoHistorico();
    }
  }

  calcularTaxaJuros(valorFinanciado: number, numParcelas: number, valorDaParcela: number) {
    const maxIter = 100;
    const tol = 1e-10;
    let i = 0.01; // chute inicial 1% ao mês

    for (let iter = 0; iter < maxIter; iter++) {
      let pow = Math.pow(1 + i, -numParcelas);
      let numerador = valorFinanciado * i;
      let denominador = 1 - pow;
      let f = numerador / denominador - valorDaParcela;

      if (Math.abs(f) < tol) {
        return i * 100; // taxa em %
      }

      // derivada
      let df = (valorFinanciado * denominador - valorFinanciado * i * numParcelas * pow) / (denominador * denominador);

      i = i - f / df;

      if (i < 0) {
        i = tol; // evitar negativo
      }
    }
    return i * 100; // taxa em %
  }

  clearParcelaIdeal() {
    this.parcelaTotal.nativeElement.value = "";
  }

  printCalc(taxaJuros: number, parcelaTotal: any, calc: string) {
    console.log(taxaJuros);
    console.log(parcelaTotal + " - " + calc);
  }

  // Métodos para gerenciar histórico
  carregarHistorico(): void {
    this.simulacoesHistorico = this.appService.obterSimulacoes();
  }

  salvarSimulacaoNoHistorico(): void {
    const valorTotal = this.valorTotal.nativeElement.value;
    const entrada = this.entrada.nativeElement.value || 'R$ 0,00';
    const parcelaResidual = this.parcelaResidual.nativeElement.value || 'R$ 0,00';
    const numParcelas = parseFloat(this.numParcelas.nativeElement.value);
    const taxaJuros = parseFloat(this.taxaJuros.nativeElement.value);
    const parcelaTotal = this.parcelaTotal.nativeElement.value;
    
    if (!valorTotal || !numParcelas || !taxaJuros || !parcelaTotal) {
      return;
    }

    const valorTotalNumerico = parseFloat(valorTotal.replace(/R\$\s?/g, "").replace(/\./g, "").replace(",", "."));
    const entradaNumerica = parseFloat(entrada.replace(/R\$\s?/g, "").replace(/\./g, "").replace(",", ".")) || 0;
    const parcelaResidualNumerica = parseFloat(parcelaResidual.replace(/R\$\s?/g, "").replace(/\./g, "").replace(",", ".")) || 0;
    const parcelaTotalNumerica = parseFloat(parcelaTotal.replace(/R\$\s?/g, "").replace(/\./g, "").replace(",", "."));
    
    const valorFinanciado = valorTotalNumerico - entradaNumerica - parcelaResidualNumerica;
    const totalPago = parcelaTotalNumerica * numParcelas;
    const totalJuros = totalPago - valorFinanciado;

    const simulacao: Omit<SimulacaoHistorico, 'id' | 'data'> = {
      valorTotal,
      entrada,
      parcelaResidual,
      numParcelas,
      taxaJuros,
      parcelaTotal,
      valorFinanciado,
      totalJuros,
      totalPago,
      instituicaoFinanceira: this.obterInstituicaoSelecionada(),
      marca: this.obterMarcaSelecionada(),
      modelo: this.obterModeloSelecionado(),
      ano: this.obterAnoSelecionado(),
      valorFipe: this.valorFIPE,
      // Novos campos
      nomeLoja: this.nomeLoja?.nativeElement?.value || '',
      observacoes: this.observacoes?.nativeElement?.value || '',
      situacaoCarro: this.situacaoCarroControl.value || '',
      quilometragem: this.quilometragem?.nativeElement?.value || '',
      cor: this.cor?.nativeElement?.value || '',
      combustivel: this.combustivelControl.value || '',
      cambio: this.cambioControl.value || '',
      anoFabricacao: this.anoFabricacao?.nativeElement?.value || '',
      anoModelo: this.anoModelo?.nativeElement?.value || '',
      placa: this.placa?.nativeElement?.value || '',
      renavam: this.renavam?.nativeElement?.value || '',
      // Dados adicionais da FIPE
      codigoVeiculo: this.codigoVeiculo,
      codigoMarca: this.codigoMarca,
      codigoModelo: this.codigoModelo,
      codigoAno: this.codigoAno,
      mesReferenciaFipe: this.resultadoFipe?.MesReferencia || '',
      combustivelFipe: this.resultadoFipe?.Combustivel || '',
      siglaCombustivelFipe: this.resultadoFipe?.SiglaCombustivel || '',
      // Dados adicionais do banco
      taxaJurosAoMes: this.obterTaxaJurosAoMes(),
      taxaJurosAoAno: this.obterTaxaJurosAoAno(),
      posicaoTaxa: this.obterPosicaoTaxa()
    };

    this.appService.salvarSimulacao(simulacao);
    this.carregarHistorico();
  }

  deletarSimulacao(id: string): void {
    this.appService.deletarSimulacao(id);
    this.carregarHistorico();
  }

  carregarSimulacao(simulacao: SimulacaoHistorico): void {
    // Carregar campos principais
    this.valorTotal.nativeElement.value = simulacao.valorTotal;
    this.entrada.nativeElement.value = simulacao.entrada;
    this.parcelaResidual.nativeElement.value = simulacao.parcelaResidual;
    this.numParcelas.nativeElement.value = simulacao.numParcelas.toString();
    this.taxaJuros.nativeElement.value = simulacao.taxaJuros.toString();
    this.parcelaTotal.nativeElement.value = simulacao.parcelaTotal;
    
    // Carregar dados da FIPE se disponíveis
    if (simulacao.valorFipe) {
      this.valorFIPE = simulacao.valorFipe;
    }
    
    // Carregar dados da FIPE (códigos e informações)
    if (simulacao.codigoVeiculo) {
      this.codigoVeiculo = simulacao.codigoVeiculo;
      this.veiculoControl.setValue(simulacao.codigoVeiculo);
      // Carregar marcas se tiver código do veículo
      this.getMarcas(simulacao.codigoVeiculo);
    }
    
    if (simulacao.codigoMarca) {
      this.codigoMarca = simulacao.codigoMarca;
      this.marcaControl.setValue(simulacao.codigoMarca);
      // Carregar modelos se tiver código da marca
      setTimeout(() => {
        if (simulacao.codigoMarca) {
          this.getModelos(simulacao.codigoMarca);
        }
      }, 500);
    }
    
    if (simulacao.codigoModelo) {
      this.codigoModelo = simulacao.codigoModelo;
      this.modeloControl.setValue(simulacao.codigoModelo);
      // Carregar anos se tiver código do modelo
      setTimeout(() => {
        if (simulacao.codigoModelo) {
          this.getAnos(simulacao.codigoModelo);
        }
      }, 1000);
    }
    
    if (simulacao.codigoAno) {
      this.codigoAno = simulacao.codigoAno;
      this.anoControl.setValue(simulacao.codigoAno);
      // Carregar resultado FIPE se tiver código do ano
      setTimeout(() => {
        if (simulacao.codigoAno) {
          this.getResultado(simulacao.codigoAno);
        }
      }, 1500);
    }
    
    // Carregar dados do banco se disponíveis
    if (simulacao.posicaoTaxa && simulacao.posicaoTaxa > 0) {
      const posicaoTaxa = simulacao.posicaoTaxa;
      setTimeout(() => {
        // Definir o valor do FormControl do banco
        this.bancoControl.setValue(posicaoTaxa.toString());
        // Selecionar a taxa sem limpar a parcela
        this.selecionarTaxaJuros(posicaoTaxa.toString());
      }, 2000);
    }
    
    // Carregar novos campos de texto
    if (this.nomeLoja?.nativeElement) this.nomeLoja.nativeElement.value = simulacao.nomeLoja || '';
    if (this.observacoes?.nativeElement) this.observacoes.nativeElement.value = simulacao.observacoes || '';
    if (this.quilometragem?.nativeElement) this.quilometragem.nativeElement.value = simulacao.quilometragem || '';
    if (this.cor?.nativeElement) this.cor.nativeElement.value = simulacao.cor || '';
    if (this.anoFabricacao?.nativeElement) this.anoFabricacao.nativeElement.value = simulacao.anoFabricacao || '';
    if (this.anoModelo?.nativeElement) this.anoModelo.nativeElement.value = simulacao.anoModelo || '';
    if (this.placa?.nativeElement) this.placa.nativeElement.value = simulacao.placa || '';
    if (this.renavam?.nativeElement) this.renavam.nativeElement.value = simulacao.renavam || '';
    
    // Carregar campos select usando FormControls
    if (simulacao.situacaoCarro) {
      this.situacaoCarroControl.setValue(simulacao.situacaoCarro);
    }
    if (simulacao.combustivel) {
      this.combustivelControl.setValue(simulacao.combustivel);
    }
    if (simulacao.cambio) {
      this.cambioControl.setValue(simulacao.cambio);
    }
    
    // Fechar o modal após carregar os dados
    this.fecharHistorico();
  }



  alternarHistorico(): void {
    this.mostrarHistorico = !this.mostrarHistorico;
  }

  fecharHistorico(): void {
    this.mostrarHistorico = false;
  }

  onHistoricoClick(event: Event): void {
    // Fecha o modal se clicar no overlay (fora do card)
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
    const partes = [];
    
    if (simulacao.marca) partes.push(simulacao.marca);
    if (simulacao.modelo) partes.push(simulacao.modelo);
    if (simulacao.ano) partes.push(simulacao.ano);
    
    if (partes.length > 0) {
      return partes.join(' ');
    }
    
    // Fallback se não tiver marca/modelo/ano
    if (simulacao.valorFipe) {
      return `Veículo - ${simulacao.valorFipe}`;
    }
    
    return 'Veículo';
  }

  private obterInstituicaoSelecionada(): string {
    const taxaSelecionada = this.taxasJuros.find(t => 
      parseFloat(t.TaxaJurosAoMes.replace(',', '.')) === parseFloat(this.taxaJuros.nativeElement.value)
    );
    return taxaSelecionada?.InstituicaoFinanceira || '';
  }

  private obterMarcaSelecionada(): string {
    const marca = this.marcas.find(m => m.codigo === this.codigoMarca);
    return marca?.nome || '';
  }

  private obterModeloSelecionado(): string {
    const modelo = this.modelos.find(m => m.codigo === this.codigoModelo);
    return modelo?.nome || '';
  }

  private obterAnoSelecionado(): string {
    const ano = this.anos.find(a => a.codigo === this.codigoAno);
    return ano?.nome || '';
  }

  private obterTaxaJurosAoMes(): string {
    const taxaSelecionada = this.taxasJuros.find(t => 
      parseFloat(t.TaxaJurosAoMes.replace(',', '.')) === parseFloat(this.taxaJuros.nativeElement.value)
    );
    return taxaSelecionada?.TaxaJurosAoMes || '';
  }

  private obterTaxaJurosAoAno(): string {
    const taxaSelecionada = this.taxasJuros.find(t => 
      parseFloat(t.TaxaJurosAoMes.replace(',', '.')) === parseFloat(this.taxaJuros.nativeElement.value)
    );
    return taxaSelecionada?.TaxaJurosAoAno || '';
  }

  private obterPosicaoTaxa(): number {
    const taxaSelecionada = this.taxasJuros.find(t => 
      parseFloat(t.TaxaJurosAoMes.replace(',', '.')) === parseFloat(this.taxaJuros.nativeElement.value)
    );
    return taxaSelecionada?.Posicao || 0;
  }

  limparTela(): void {
    // Limpar campos principais
    this.valorTotal.nativeElement.value = '';
    this.entrada.nativeElement.value = '';
    this.parcelaResidual.nativeElement.value = '';
    this.numParcelas.nativeElement.value = '36';
    this.taxaJuros.nativeElement.value = '';
    this.parcelaTotal.nativeElement.value = '';
    
    // Limpar dados da FIPE
    this.valorFIPE = '';
    this.resultadoFipe = undefined;
    this.codigoVeiculo = '';
    this.codigoMarca = '';
    this.codigoModelo = '';
    this.codigoAno = '';
    this.marcas = [];
    this.modelos = [];
    this.anos = [];
    
    // Limpar FormControls
    this.veiculoControl.setValue('');
    this.marcaControl.setValue('');
    this.modeloControl.setValue('');
    this.anoControl.setValue('');
    this.bancoControl.setValue('');
    this.situacaoCarroControl.setValue('');
    this.combustivelControl.setValue('');
    this.cambioControl.setValue('');
    
    // Limpar campos de texto
    if (this.nomeLoja?.nativeElement) this.nomeLoja.nativeElement.value = '';
    if (this.observacoes?.nativeElement) this.observacoes.nativeElement.value = '';
    if (this.quilometragem?.nativeElement) this.quilometragem.nativeElement.value = '';
    if (this.cor?.nativeElement) this.cor.nativeElement.value = '';
    if (this.anoFabricacao?.nativeElement) this.anoFabricacao.nativeElement.value = '';
    if (this.anoModelo?.nativeElement) this.anoModelo.nativeElement.value = '';
    if (this.placa?.nativeElement) this.placa.nativeElement.value = '';
    if (this.renavam?.nativeElement) this.renavam.nativeElement.value = '';
  }

  // Métodos para controlar collapse dos cards
  toggleCardFipe(): void {
    this.cardFipeCollapsed = !this.cardFipeCollapsed;
  }

  toggleCardCalculadora(): void {
    this.cardCalculadoraCollapsed = !this.cardCalculadoraCollapsed;
  }
}
