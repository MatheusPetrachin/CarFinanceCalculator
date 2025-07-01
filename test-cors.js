const https = require('https');
const http = require('http');

// Função para fazer requisição HTTPS
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || 443,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                'Cache-Control': 'no-cache'
            },
            ...options
        };

        const client = urlObj.protocol === 'https:' ? https : http;
        
        const req = client.request(requestOptions, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.end();
    });
}

// URLs para testar
const testUrls = [
    'https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v1/odata/PeriodosDisponiveis',
    'https://www.bcb.gov.br/api/servico/sitebcb/historicotaxajurosdiario/atual',
    'https://api.allorigins.win/raw?url=https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v1/odata/PeriodosDisponiveis'
];

async function testAPIs() {
    console.log('🧪 Testando APIs do BCB e Olinda...\n');

    for (let i = 0; i < testUrls.length; i++) {
        const url = testUrls[i];
        console.log(`📡 Testando: ${url}`);
        
        try {
            const response = await makeRequest(url);
            console.log(`✅ Status: ${response.statusCode}`);
            console.log(`📄 Content-Type: ${response.headers['content-type']}`);
            
            if (response.statusCode === 200) {
                try {
                    const jsonData = JSON.parse(response.data);
                    console.log(`📊 Dados recebidos: ${Object.keys(jsonData).length} propriedades`);
                } catch (e) {
                    console.log(`📄 Resposta não é JSON válido`);
                }
            }
            
        } catch (error) {
            console.log(`❌ Erro: ${error.message}`);
        }
        
        console.log('---\n');
    }

    console.log('🎯 Teste concluído!');
    console.log('\n💡 Se todas as APIs falharem, o sistema usará dados mock como fallback.');
}

// Executar o teste
testAPIs().catch(console.error); 