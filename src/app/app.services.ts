import { Injectable } from "@angular/core";
import { environment } from "../environments/environment";
import { HttpClient } from '@angular/common/http';
import { Marca, ModeloAno, Modelo, ResultadoFipe, TaxaJuros, ResultadoTaxaJuros, PeriodosDisponiveis, SimulacaoHistorico } from "./app.model";
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';


@Injectable({
    providedIn: 'root'
})
export class AppService {

    APIFipeUrl: string = environment.apiFipeUrl;
    APIBCBUrl: string = environment.apiBCBUrl;
    APIBCBPeriodosUrl: string = environment.apiBCBPeriodosUrl;

    constructor(private http: HttpClient) { }

    getMarcas(codigoVeiculo: string): Observable<Marca[]> {
        return this.http.get<Marca[]>(`${this.APIFipeUrl}${codigoVeiculo}/marcas`);
    }

    getModelos(codigoVeiculo: string, codigoMarca: string): Observable<Modelo> {
        return this.http.get<Modelo>(`${this.APIFipeUrl}${codigoVeiculo}/marcas/${codigoMarca}/modelos`);
    }

    getAnos(codigoVeiculo: string, codigoMarca: string, codigoModelo: string): Observable<ModeloAno[]> {
        return this.http.get<ModeloAno[]>(`${this.APIFipeUrl}${codigoVeiculo}/marcas/${codigoMarca}/modelos/${codigoModelo}/anos`);
    }

    getResultado(codigoVeiculo: string, codigoMarca: string, codigoModelo: string, codigoAno: string): Observable<ResultadoFipe> {
        return this.http.get<ResultadoFipe>(`${this.APIFipeUrl}${codigoVeiculo}/marcas/${codigoMarca}/modelos/${codigoModelo}/anos/${codigoAno}`);
    }

    getTaxasJuros(): Observable<ResultadoTaxaJuros> {
        return this.getPeriodosDisponiveis().pipe(
            switchMap(periodos => {
                // Pega o primeiro período (mais recente)
                const periodoMaisRecente = periodos.value[0];
                const dataInicio = periodoMaisRecente.inicioPeriodo;

                return this.http.get<ResultadoTaxaJuros>(this.APIBCBUrl + `atual?filtro=(codigoSegmento%20eq%20%271%27)%20and%20(codigoModalidade%20eq%20%27401101%27)%20and%20(InicioPeriodo%20eq%20%27${dataInicio}%27)`);
            })
        );
    }

    getTaxasJurosFallback(): Observable<ResultadoTaxaJuros> {
        return this.getPeriodosDisponiveis().pipe(
            switchMap(periodos => {
                // Pega o primeiro período (mais recente)
                const periodoMaisRecente = periodos.value[0];
                const dataInicio = periodoMaisRecente.inicioPeriodo;

                return this.http.get<ResultadoTaxaJuros>(this.APIBCBUrl + `atual?filtro=(codigoSegmento%20eq%20%271%27)%20and%20(codigoModalidade%20eq%20%27401101%27)%20and%20(InicioPeriodo%20eq%20%27${dataInicio}%27)`);
            })
        );
    }

    getPeriodosDisponiveis(): Observable<PeriodosDisponiveis> {
        const url = this.APIBCBPeriodosUrl + 'PeriodosDisponiveis';
        return this.http.get<PeriodosDisponiveis>(url);
    }

    // Métodos para gerenciar histórico de simulações
    private readonly STORAGE_KEY = 'simulacoes_historico';

    salvarSimulacao(simulacao: Omit<SimulacaoHistorico, 'id' | 'data'>): void {
        const simulacoes = this.obterSimulacoes();
        const novaSimulacao: SimulacaoHistorico = {
            ...simulacao,
            id: this.gerarId(),
            data: new Date().toISOString()
        };

        simulacoes.unshift(novaSimulacao); // Adiciona no início da lista
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(simulacoes));
    }

    obterSimulacoes(): SimulacaoHistorico[] {
        const dados = localStorage.getItem(this.STORAGE_KEY);
        return dados ? JSON.parse(dados) : [];
    }

    deletarSimulacao(id: string): void {
        const simulacoes = this.obterSimulacoes();
        const simulacoesFiltradas = simulacoes.filter(s => s.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(simulacoesFiltradas));
    }

    limparHistorico(): void {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    private gerarId(): string {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }
}
