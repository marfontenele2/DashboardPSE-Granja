// data.js

/**
 * Dados Fixos e Fictícios para o Dashboard PSE.
 * Contém informações sobre escolas (agora da lista COMPLETA fornecida), equipes eMulti,
 * e o status de realização das ações do PSE (fictício para demonstração).
 */

// Lista de equipes eMulti disponíveis (fixa)
export const emultis = ['SEDE', 'PARAZINHO', 'TIMONHA']; // Assegura TIMONHA em caixa alta aqui


// Dados reais das escolas, seus INEPs e eMulti correspondente (LISTA COMPLETA FORNECIDA)
// ATENÇÃO: A eMulti 'Timonha' foi padronizada para 'TIMONHA' em todos os objetos para consistência.
export const schools = [
  { inep: '23004584', name: 'CEI MONSENHOR JOSE MARIA DE VASCONCELOS', eMulti: 'PARAZINHO' },
  { inep: '23004649', name: 'CEI VERA MARIA ANGELIM DIAS', eMulti: 'PARAZINHO' },
  { inep: '23004665', name: 'CLARISMUNDO ALVES ARAGAO EEF', eMulti: 'TIMONHA' },
  { inep: '23004711', name: 'DELMIRO DE OLIVEIRA EEF DEPUTADO', eMulti: 'SEDE' },
  { inep: '23004720', name: 'DR JOSE GLAUBERTON ALVES SA EEF', eMulti: 'SEDE' },
  { inep: '23004762', name: 'FRANCISCO INACIO DE ARAUJO EEF', eMulti: 'SEDE' },
  { inep: '23004835', name: 'MARTINIANO FONTENELE MAGALHAES EEF', eMulti: 'TIMONHA' },
  { inep: '23004878', name: 'ESCOLA MUNICIPAL DE TEMPO INTEGRAL DONA INA', eMulti: 'SEDE' },
  { inep: '23004894', name: 'NAPOLEAO FONTENELE ROCHA EEF', eMulti: 'SEDE' },
  { inep: '23004967', name: 'JOAQUIM BARBOSA DE MELO EEF', eMulti: 'SEDE' },
  { inep: '23005025', name: 'JOSE LENDENGUE DA COSTA EEF', eMulti: 'SEDE' },
  { inep: '23005033', name: 'EEMTI SAO JOSE', eMulti: 'SEDE' },
  { inep: '23005041', name: 'SAO JOSE EEF', eMulti: 'TIMONHA' },
  { inep: '23005157', name: 'EEM CORONEL LUIZ FELIPE', eMulti: 'SEDE' },
  { inep: '23005190', name: 'MARIA GUILHERME DE CARVALHO EEF', eMulti: 'TIMONHA' },
  { inep: '23005254', name: 'JOAO MACHADO EEF', eMulti: 'TIMONHA' },
  { inep: '23005351', name: 'PEDRO MENDES MACHADO EEF', eMulti: 'SEDE' },
  { inep: '23005378', name: 'RAIMUNDO EEF SAO', eMulti: 'SEDE' },
  { inep: '23005408', name: 'TEODORICO GUILHERME PEREIRA EEF', eMulti: 'PARAZINHO' },
  { inep: '23005416', name: 'SINHA EEF DONA', eMulti: 'SEDE' },
  { inep: '23005475', name: 'JONAS RIBEIRO DOS SANTOS EEF', eMulti: 'TIMONHA' },
  { inep: '23005505', name: 'JOSE VITAL DE SOUSA EEF', eMulti: 'TIMONHA' },
  { inep: '23005521', name: 'JUAREZ CRUZ EEF DR', eMulti: 'TIMONHA' },
  { inep: '23005548', name: 'GUILHERME TELES GOUVEIA EEF', eMulti: 'SEDE' },
  { inep: '23005645', name: 'ELIEZER ARRUDA EEF', eMulti: 'PARAZINHO' },
  { inep: '23005653', name: 'ESMERINO ARRUDA FILHO EEF', eMulti: 'PARAZINHO' },
  { inep: '23005742', name: 'FRANCISCA CLEOMAR VERAS FREITAS EEF', eMulti: 'PARAZINHO' },
  { inep: '23005785', name: 'NOSSA SENHORA APARECIDA EEF', eMulti: 'TIMONHA' },
  { inep: '23005890', name: 'LIVIO BARRETO EEF', eMulti: 'TIMONHA' },
  { inep: '23005912', name: 'EEF FRANCISCO CARNEIRO FONTENELE', eMulti: 'SEDE' },
  { inep: '23005947', name: 'OLAVO OLIVEIRA EEF SENADOR', eMulti: 'SEDE' },
  { inep: '23005963', name: 'JOSE PEDRO DE BRITO EEF', eMulti: 'TIMONHA' },
  { inep: '23006005', name: 'EEF RAIMUNDO MAURO XAVIER DE OLIVEIRA', eMulti: 'TIMONHA' },
  { inep: '23006048', name: 'EEF LUIZ MACHADO', eMulti: 'TIMONHA' },
  { inep: '23013907', name: 'CORREGO DO LINO EEF', eMulti: 'SEDE' },
  { inep: '23014121', name: 'JOAO FONTENELE DE ARAUJO EEF', eMulti: 'SEDE' },
  { inep: '23174943', name: 'GALDINO MARQUES DE OLIVEIRA EEF', eMulti: 'SEDE' },
  { inep: '23175044', name: 'QUINCAS DE OLIVEIRA EEF', eMulti: 'PARAZINHO' },
  { inep: '23198583', name: 'FRANCISCA FONTENELE DE SOUSA BATISTA EEF', eMulti: 'SEDE' },
  { inep: '23218410', name: 'RAIMUNDO AUGUSTO PASSOS EEF', eMulti: 'TIMONHA' },
  { inep: '23231718', name: 'SAO JUDAS TADEU EEF', eMulti: 'SEDE' },
  { inep: '23235110', name: 'MARIA TOINHO EEF', eMulti: 'TIMONHA' },
  { inep: '23236655', name: 'EEEP GUILHERME TELES GOUVEIA', eMulti: 'SEDE' },
  { inep: '23240504', name: 'FRANCISCA PORTELA XAVIER EEF', eMulti: 'TIMONHA' },
  { inep: '23240725', name: 'JOSE FIRMINO DOS SANTOS EEF', eMulti: 'TIMONHA' },
  { inep: '23245247', name: 'CEJA GUILHERME GOUVEIA', eMulti: 'SEDE' },
  { inep: '23249870', name: 'CARLOS DIAS MARTINS CEI', eMulti: 'SEDE' },
  { inep: '23252430', name: 'EEEP PROFESSOR EMMANUEL OLIVEIRA DE ARRUDA COELHO', eMulti: 'SEDE' },
  { inep: '23259124', name: 'CEI IZIDORIO JOSE PEREIRA', eMulti: 'TIMONHA' },
  { inep: '23260688', name: 'ALZIRA MATILDE DE OLIVEIRA EEF', eMulti: 'TIMONHA' },
  { inep: '23271043', name: 'CEI MONSENHOR JOSE MARIA DE VASCONCELOS', eMulti: 'PARAZINHO' },
  { inep: '23274220', name: 'MARIA CRUZ DE VASCONCELOS SOUSA CEI', eMulti: 'SEDE' },
  { inep: '23274336', name: 'FRANCISCA ALBA DO NASCIMENTO CEI', eMulti: 'TIMONHA' },
  { inep: '23275049', name: 'EEM NOSSA SENHORA DO LIVRAMENTO', eMulti: 'PARAZINHO' },
  { inep: '23276274', name: 'ESCOLA DE ENSINO FUN DAMENTAL ROMEU ALDIGUERI', eMulti: 'PARAZINHO' },
  { inep: '23545275', name: 'RAIMUNDO IVAN ROCHA CEI', eMulti: 'PARAZINHO' },
  { inep: '23004584', name: 'ARZILIA MOTA EEF DONA', eMulti: 'PARAZINHO' }
];


// Nomes das 14 ações do PSE
export const allPseActions = [
  'Alimentação Saudável',
  'Atividade Física',
  'Cultura de Paz',
  'Prevenção de Violências e Acidentes',
  'Doenças Negligenciadas',
  'Drogas',
  'Covid-19',
  'Saúde Ambiental',
  'Saúde Bucal',
  'Saúde Auditiva',
  'Saúde Ocular',
  'Saúde Mental',
  'Saúde Sexual/HIV/IST',
  'Situação Vacinal',
  'Semana saúde na escola', // ADICIONADO: Ação da planilha 'pseTema'
];

// Nomes das 5 ações prioritárias
export const priorityPseActions = [
  'Prevenção da violência e promoção da cultura da paz',
  'Saúde mental',
  'Saúde sexual e reprodutiva',
  'Alimentação saudável e prevenção da obesidade',
  'Verificação da situação vacinal',
];

// Mapeamento das colunas do Excel "pseTema" para as 14 ações do PSE
// Baseado nos cabeçalhos fornecidos na interação anterior.
export const pseTemaColumnMapping = {
    'Agravos negligenciados': 'Doenças Negligenciadas',
    'Alimentação saudável': 'Alimentação Saudável',
    'Cidadania e direitos humanos': 'Cultura de Paz',
    'Dependência química / tabaco /': 'Drogas',
    'Prevenção da violência e promo': 'Prevenção de Violências e Acidentes',
    'Saúde ambiental': 'Saúde Ambiental',
    'Saúde bucal': 'Saúde Bucal',
    'Saúde mental': 'Saúde Mental',
    'Saúde sexual e reprodutiva': 'Saúde Sexual/HIV/IST',
    'Semana saúde na escola': 'Semana saúde na escola', // Mapeamento para a nova ação
    // Outras colunas do PSE Tema que não são ações específicas do PSE e não precisam ser mapeadas para `allPseActions`
    // 'Autocuidado de pessoas com doe': 'Autocuidado de pessoas com doe',
    // 'Ações de combate ao Aedes aegy': 'Ações de combate ao Aedes aegy',
    // 'Envelhecimento / Climatério / ': 'Envelhecimento / Climatério / ',
    // 'Plantas medicinais / fitoterap': 'Plantas medicinais / fitoterap',
    // 'Saúde do trabalhador': 'Saúde do trabalhador',
};

// Mapeamento das colunas do Excel "psePratica" para as 14 ações do PSE
// Baseado nos cabeçalhos fornecidos na interação anterior.
export const psePraticaColumnMapping = {
    'Antropometria': 'Alimentação Saudável',
    'Aplicação tópica de flúor': 'Saúde Bucal',
    'Desenvolvimento da linguagem': 'Saúde Auditiva',
    'Escovação dental supervisionad': 'Saúde Bucal',
    'Práticas corporais / atividade': 'Atividade Física',
    'Saúde auditiva': 'Saúde Auditiva',
    'Saúde ocular': 'Saúde Ocular',
    'Verificação da situação vacina': 'Situação Vacinal',
};


// Meta de realização para os indicadores (ex: 50% das escolas devem ter a ação realizada)
export const INDICATOR_TARGET_PERCENTAGE = 0.50; // 50%

// Dados fictícios gerados ao carregar o módulo (serão sobrescritos pelo upload real)
export let mockPseActions = [];
export let mockPriorityActions = [];

// Funções para atualizar os dados do mock (se ainda forem usados para algum fallback)
export function updatePseData(newData) {
    mockPseActions = newData;
}

export function updatePriorityData(newData) {
    mockPriorityActions = newData;
}