// js/data.js (VERSÃO FINAL COM NOVAS REGRAS DE NEGÓCIO)

/*
 * Este arquivo funciona como o cérebro de configuração da aplicação.
 * Ele centraliza definições importantes como eMultis, todas as ações possíveis,
 * e a nova estrutura de Ações Prioritárias Agregadas.
 */

// Lista de eMultis.
export const emultis = [
    'SEDE',
    'PARAZINHO',
    'TIMONHA',
];

// A "fonte da verdade" para TODAS as ações individuais possíveis no sistema.
// EM js/data.js

// EM js/data.js (apenas para verificação, esta lista é a mesma da etapa anterior)

export const normalizedPseActions = [
    { key: 'Antropometria', name: 'Antropometria', icon: 'fas fa-ruler-combined' },
    { key: 'Aplicaotpicadefluor', name: 'Aplicação Tópica de Flúor', icon: 'fas fa-tooth' },
    { key: 'Desenvolvimentodalinguagem', name: 'Desenvolvimento da Linguagem', icon: 'fas fa-comments' },
    { key: 'Escovaodentalsupervisionada', name: 'Escovação Dental Supervisionada', icon: 'fas fa-toothbrush' }, // <--- Ícone aqui
    { key: 'Praticascorporaisatividadefisica', name: 'Práticas Corporais / Atividade Física', icon: 'fas fa-person-running' },
    { key: 'Saudeauditiva', name: 'Saúde Auditiva', icon: 'fas fa-ear-listen' },
    { key: 'Saudeocular', name: 'Saúde Ocular', icon: 'fas fa-eye' },
    { key: 'VerificacaodasituacaoVacinal', name: 'Verificação da Situação Vacinal', icon: 'fas fa-syringe' },
    { key: 'DoencasNegligenciadas', name: 'Doenças Negligenciadas', icon: 'fas fa-microscope' },
    { key: 'AlimentacaoSaudavel', name: 'Alimentação Saudável', icon: 'fas fa-carrot' },
    { key: 'CulturaDePaz', name: 'Cultura de Paz', icon: 'fas fa-dove' },
    { key: 'PrevencaoDeViolenciasEAcidentes', name: 'Prevenção de Violências e Acidentes', icon: 'fas fa-shield-halved' },
    { key: 'SaudeAmbiental', name: 'Saúde Ambiental', icon: 'fas fa-leaf' },
    { key: 'SaudeBucal', name: 'Saúde Bucal', icon: 'fas fa-tooth' },
    { key: 'SaudeMental', name: 'Saúde Mental', icon: 'fas fa-brain' },
    { key: 'SaudeSexualHIVIST', name: 'Saúde Sexual/HIV/IST', icon: 'fas fa-ribbon' },
    { key: 'SemanasNaEscola', name: 'Semana Saúde na Escola', icon: 'fas fa-school-flag' },
    { key: 'Covid19', name: 'COVID-19', icon: 'fas fa-virus-covid' }
];
// Gera uma lista simples contendo apenas as chaves (keys) de todas as ações.
export const allPseActions = normalizedPseActions.map(action => action.key);


// ==============================================================================
// NOVA ESTRUTURA PARA O INDICADOR 2 - AÇÕES PRIORITÁRIAS AGREGADAS
// Esta é a nova regra de negócio que definimos. Cada objeto representa um grupo prioritário.
// A lógica será: uma escola precisa cumprir pelo menos UMA ação de CADA grupo abaixo.
// ==============================================================================
export const priorityActionGroups = [
    {
        name: 'Prevenção da violência e promoção da cultura da paz',
        actions: ['PrevencaoDeViolenciasEAcidentes', 'CulturaDePaz']
    },
    {
        name: 'Saúde mental',
        actions: ['SaudeMental']
    },
    {
        name: 'Saúde sexual e reprodutiva',
        actions: ['SaudeSexualHIVIST']
    },
    {
        name: 'Alimentação saudável e prevenção da obesidade',
        actions: ['AlimentacaoSaudavel', 'Antropometria']
    },
    {
        name: 'Verificação da situação vacinal',
        actions: ['VerificacaodasituacaoVacinal']
    }
];


// Mapeamentos de colunas da planilha para as chaves internas (continua o mesmo)
export const pseTemaColumnMapping = {
    'Agravos negligenciados': 'DoencasNegligenciadas',
    'Alimentação saudável': 'AlimentacaoSaudavel',
    'Cidadania e direitos humanos': 'CulturaDePaz',
    'Prevenção da violência e promo': 'PrevencaoDeViolenciasEAcidentes',
    'Saúde ambiental': 'SaudeAmbiental',
    'Saúde bucal': 'SaudeBucal',
    'Saúde mental': 'SaudeMental',
    'Saúde sexual e reprodutiva': 'SaudeSexualHIVIST',
    'Semana saúde na escola': 'SemanasNaEscola',
};

export const psePraticaColumnMapping = {
    'Antropometria': 'Antropometria',
    'Aplicação tópica de flúor': 'Aplicaotpicadefluor',
    'Desenvolvimento da linguagem': 'Desenvolvimentodalinguagem',
    'Escovação dental supervisionad': 'Escovaodentalsupervisionada',
    'Práticas corporais / atividade': 'Praticascorporaisatividadefisica',
    'Saúde auditiva': 'Saudeauditiva',
    'Saúde ocular': 'Saudeocular',
    'Verificação da situação vacina': 'VerificacaodasituacaoVacinal',
};