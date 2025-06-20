// data.js

// A lista de escolas (schools) agora será gerenciada dinamicamente no Firestore
// através do Painel Administrativo. Este arquivo NÃO conterá mais a lista estática.

// Lista de eMultis (utilizada para gerar botões e rankings)
// Mantenha esta lista em caixa alta para consistência com as comparações (eMulti.toUpperCase())
export const emultis = [
    'SEDE',
    'PARAZINHO',
    'TIMONHA', // CORRIGIDO: Agora em caixa alta para consistência
    // Adicione outras eMultis conforme necessário
];

// Todas as ações PSE possíveis (gerais), com nomes legíveis para exibição
export const allPseActions = [
    'Antropometria',
    'Aplicação tópica de flúor',
    'Desenvolvimento da linguagem',
    'Escovação dental supervisionada',
    'Práticas corporais / atividade física',
    'Saúde auditiva',
    'Saúde ocular',
    'Verificação da situação vacinal',
    'Doenças Negligenciadas',
    'Alimentação Saudável',
    'Cultura de Paz',
    'Drogas',
    'Prevenção de Violências e Acidentes',
    'Saúde Ambiental',
    'Saúde Bucal',
    'Saúde Mental',
    'Saúde Sexual/HIV/IST',
    'Semana saúde na escola',
    'Covid19'
];

// Ações PSE consideradas prioritárias (para o Indicador 2)
export const priorityPseActions = [
    'Antropometria',
    'Verificação da situação vacinal',
    'Saúde Bucal',
    'Saúde Ocular'
];

// Mapeamento de colunas da planilha "PSE Tema" para nomes de ações no sistema
// As chaves são os nomes exatos das colunas no Excel, os valores são os nomes das ações em allPseActions
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
    'Semana saúde na escola': 'Semana saúde na escola',
};

// Mapeamento de colunas da planilha "PSE Prática" para nomes de ações no sistema
// As chaves são os nomes exatos das colunas no Excel, os valores são os nomes das ações em allPseActions
export const psePraticaColumnMapping = {
    'Antropometria': 'Antropometria',
    'Aplicação tópica de flúor': 'Aplicação tópica de flúor',
    'Desenvolvimento da linguagem': 'Desenvolvimento da linguagem',
    'Escovação dental supervisionad': 'Escovação dental supervisionada',
    'Práticas corporais / atividade': 'Práticas corporais / atividade física',
    'Saúde auditiva': 'Saúde Auditiva',
    'Saúde ocular': 'Saúde Ocular',
    'Verificação da situação vacina': 'Verificação da situação vacinal',
};

// Um valor de porcentagem alvo para exibição ou cálculos, se necessário.
export const INDICATOR_TARGET_PERCENTAGE = 75;