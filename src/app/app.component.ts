import { ElementRef } from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Marca, Modelo, ModeloAno, ResultadoFipe, TaxaJuros, ResultadoTaxaJuros } from './app.model';
import { AppService } from './app.services';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatOptionModule,
    HttpClientModule
  ]
})
export class AppComponent implements OnInit {

  @ViewChild("valorTotal") valorTotal!: ElementRef;
  @ViewChild("entrada") entrada!: ElementRef;
  @ViewChild("parcelaResidual") parcelaResidual!: ElementRef;
  @ViewChild("numParcelas") numParcelas!: ElementRef;
  @ViewChild("taxaJuros") taxaJuros!: ElementRef;
  @ViewChild("parcelaTotal") parcelaTotal!: ElementRef;

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

  constructor(private appService: AppService) { }

  ngOnInit(): void {
    this.getTaxasJuros();
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
        console.log('Taxas de juros carregadas:', this.taxasJuros);
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
        console.log('Taxas de juros carregadas (fallback):', this.taxasJuros);
      },
      error => {
        console.error('Erro no fallback também:', error);
      }
    );
  }

  selecionarTaxaJuros(taxa: TaxaJuros) {
    // Converte a taxa de juros ao mês para número e define no campo
    const taxaNumerica = parseFloat(taxa.TaxaJurosAoMes.replace(',', '.'));
    this.taxaJuros.nativeElement.value = taxaNumerica.toFixed(2);
    this.clearParcelaIdeal();
  }

  calcular() {

    var valorTotal = this.valorTotal.nativeElement.value.replace("R$ ", "").replace(".", "").replace(",", ".");
    var entrada = this.entrada.nativeElement.value.replace("R$ ", "").replace(".", "").replace(",", ".");
    var parcelaResidual = this.parcelaResidual.nativeElement.value.replace("R$ ", "").replace(".", "").replace(",", ".");

    var numParcelas = parseFloat(this.numParcelas.nativeElement.value);
    var taxaJuros = this.taxaJuros.nativeElement.value / 100;
    var valorFinanciado = valorTotal - entrada - parcelaResidual;
    var parcelaTotal = parseFloat(this.parcelaTotal.nativeElement.value.replace("R$ ", "").replace(".", "").replace(",", "."));

    if (parcelaTotal) {
      this.taxaJuros.nativeElement.value = this.calcularTaxaJuros(valorFinanciado, numParcelas, parcelaTotal);
    }
    else if (taxaJuros) {
      this.parcelaTotal.nativeElement.value = "R$ " + ((valorFinanciado * taxaJuros) / (1 - (1 + taxaJuros) ** (- numParcelas))).toFixed(2).replace(".", ",");
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
}
