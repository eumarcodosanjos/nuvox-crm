-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  DADOS DE TESTE — NÃO SÃO CLIENTES REAIS                         ║
-- ║                                                                  ║
-- ║  Todo lead e toda tarefa daqui começam com "[TESTE]".            ║
-- ║  As datas são relativas ao dia em que o seed roda, para a tela   ║
-- ║  sempre aparecer preenchida.                                     ║
-- ║                                                                  ║
-- ║  Para APAGAR tudo que este seed criou, rode o bloco "LIMPEZA"    ║
-- ║  abaixo sozinho. Rodar o seed de novo também limpa antes.        ║
-- ╚══════════════════════════════════════════════════════════════════╝
-- Valores em CENTAVOS. Horários gravados em UTC (America/Sao_Paulo = UTC-3).

-- ── LIMPEZA ───────────────────────────────────────────────────────────
DELETE FROM tarefas   WHERE titulo LIKE '[TESTE]%';
DELETE FROM propostas WHERE negocio_id IN (SELECT n.id FROM negocios n JOIN leads l ON l.id = n.lead_id WHERE l.nome LIKE '[TESTE]%');
DELETE FROM licencas  WHERE lead_id    IN (SELECT id FROM leads WHERE nome LIKE '[TESTE]%');
DELETE FROM negocios  WHERE lead_id    IN (SELECT id FROM leads WHERE nome LIKE '[TESTE]%');
DELETE FROM leads     WHERE nome LIKE '[TESTE]%';
DELETE FROM metas     WHERE mes = strftime('%Y-%m-01', 'now', '-3 hours') AND valor = 6000000;
-- ── FIM DA LIMPEZA ───────────────────────────────────────────────────

-- Leads: (nome, organização, tipo, origem, telefone, e-mail, dias atrás)
INSERT INTO leads (nome, organizacao, tipo, origem, telefone, email, created_at)
SELECT column1, column2, column3, column4, column5, column6,
       strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-' || column7 || ' days')
FROM (VALUES
  ('[TESTE] Carla Menezes',   'Federação Catarinense de Judô',        'federacao',          'indicacao', '(48) 90000-0001', 'carla@teste.invalid',   2),
  ('[TESTE] Rafael Duarte',   'Federação Paranaense de Karatê',       'federacao',          'whatsapp',  '(41) 90000-0002', 'rafael@teste.invalid',  5),
  ('[TESTE] Juliana Prado',   'Academia Leão Dourado',                'academia',           'instagram', '(48) 90000-0003', 'juliana@teste.invalid', 1),
  ('[TESTE] Bruno Takeda',    'Dojô Takeda',                          'academia',           'instagram', '(11) 90000-0004', 'bruno@teste.invalid',   3),
  ('[TESTE] Marina Costa',    'Copa Sul de Jiu-Jitsu',                'organizador_evento', 'site',      '(51) 90000-0005', 'marina@teste.invalid',  8),
  ('[TESTE] Paulo Henrique',  'Prefeitura de Palhoça — Esportes',     'prefeitura',         'indicacao', '(48) 90000-0006', 'paulo@teste.invalid',  12),
  ('[TESTE] Aline Ribeiro',   'Federação Gaúcha de Taekwondo',        'federacao',          'whatsapp',  '(51) 90000-0007', 'aline@teste.invalid',  15),
  ('[TESTE] Diego Martins',   'CT Martins Muay Thai',                 'academia',           'whatsapp',  '(47) 90000-0008', 'diego@teste.invalid',   4),
  ('[TESTE] Fernanda Lopes',  'Open Floripa de Karatê',               'organizador_evento', 'instagram', '(48) 90000-0009', 'fernanda@teste.invalid',6),
  ('[TESTE] Gustavo Rocha',   'Academia Rocha BJJ',                   'academia',           'site',      '(21) 90000-0010', 'gustavo@teste.invalid', 9),
  ('[TESTE] Helena Vargas',   'Liga Mineira de Kickboxing',           'federacao',          'outro',     '(31) 90000-0011', 'helena@teste.invalid', 20),
  ('[TESTE] Igor Nakamura',   'Associação Nakamura de Judô',          'academia',           'indicacao', '(11) 90000-0012', 'igor@teste.invalid',   25),
  ('[TESTE] Kátia Souza',     'Federação Baiana de Jiu-Jitsu',        'federacao',          'indicacao', '(71) 90000-0013', 'katia@teste.invalid',  60),
  ('[TESTE] Lucas Almeida',   'Academia Almeida Fight',               'academia',           'instagram', '(48) 90000-0014', 'lucas@teste.invalid',  75),
  ('[TESTE] Mônica Freitas',  'Federação Catarinense de Karatê',      'federacao',          'whatsapp',  '(48) 90000-0015', 'monica@teste.invalid', 120),
  ('[TESTE] Otávio Bezerra',  'Prefeitura de São José — Esportes',    'prefeitura',         'site',      '(48) 90000-0016', 'otavio@teste.invalid', 40)
);

-- Negócios: (lead, produto, etapa, implantação, mensal, avulso, criado há N dias, fechado há N dias | NULL)
INSERT INTO negocios (lead_id, produto_id, etapa, valor_implantacao, valor_mensal, valor_avulso, created_at, fechado_em)
SELECT l.id, p.id, v.column3, v.column4, v.column5, v.column6,
       strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-' || v.column7 || ' days'),
       CASE WHEN v.column8 IS NULL THEN NULL
            ELSE strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-' || v.column8 || ' days') END
FROM (VALUES
  ('[TESTE] Carla Menezes',  'Nuvox Federações', 'novo',        500000,  90000,      0,   2, NULL),
  ('[TESTE] Juliana Prado',  'Nuvox Academia',   'novo',             0,  19900,      0,   1, NULL),
  ('[TESTE] Bruno Takeda',   'Nuvox Academia',   'novo',             0,  19900,      0,   3, NULL),
  ('[TESTE] Diego Martins',  'Nuvox Academia',   'contato',          0,  24900,      0,   4, NULL),
  ('[TESTE] Rafael Duarte',  'Nuvox Federações', 'contato',     600000, 120000,      0,   5, NULL),
  ('[TESTE] Fernanda Lopes', 'Nuvox Combat',     'contato',          0,      0, 450000,   6, NULL),
  ('[TESTE] Marina Costa',   'Nuvox Combat',     'proposta',         0,      0, 800000,   8, NULL),
  ('[TESTE] Aline Ribeiro',  'Nuvox Federações', 'proposta',     450000, 100000,      0,  15, NULL),
  ('[TESTE] Gustavo Rocha',  'Nuvox Academia',   'proposta',          0,  29900,      0,   9, NULL),
  ('[TESTE] Paulo Henrique', 'Nuvox Combat',     'negociacao',  200000,      0, 1200000, 12, NULL),
  ('[TESTE] Helena Vargas',  'Nuvox Federações', 'negociacao',  700000, 150000,      0,  20, NULL),
  ('[TESTE] Igor Nakamura',  'Nuvox Academia',   'fechado',          0,  19900,      0,  25,   3),
  ('[TESTE] Kátia Souza',    'Nuvox Federações', 'fechado',     500000, 110000,      0,  60,  10),
  ('[TESTE] Otávio Bezerra', 'Nuvox Combat',     'fechado',     150000,      0,  600000, 40,   1),
  ('[TESTE] Lucas Almeida',  'Nuvox Academia',   'fechado',          0,  24900,      0,  75,  45),
  ('[TESTE] Mônica Freitas', 'Nuvox Federações', 'fechado',     550000, 120000,      0, 120,  80),
  ('[TESTE] Lucas Almeida',  'Nuvox Combat',     'perdido',          0,      0,  300000,  70, NULL),
  ('[TESTE] Bruno Takeda',   'Nuvox Combat',     'perdido',          0,      0,  250000,  30, NULL)
) v
JOIN leads l    ON l.nome = v.column1
JOIN produtos p ON p.nome = v.column2;

-- GovEscolar: leads com os campos próprios (município, cargo, rede, tamanho)
INSERT INTO leads (nome, organizacao, tipo, origem, telefone, email, municipio, uf, cargo_contato, rede_ensino, qtd_escolas, qtd_alunos, created_at)
SELECT column1, column2, column3, column4, column5, column6, column7, column8, column9, column10, column11, column12,
       strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-' || column13 || ' days')
FROM (VALUES
  ('[TESTE] Renata Oliveira', 'Secretaria Municipal de Educação de Biguaçu', 'secretaria_educacao', 'indicacao', '(48) 90000-0017', 'renata@teste.invalid', 'Biguaçu', 'SC', 'secretario_educacao', 'municipal', 24, 9800, 3),
  ('[TESTE] Sérgio Lima',     'EEB Professora Maria Luz',                     'escola',              'site',      '(48) 90000-0018', 'sergio@teste.invalid', 'Tubarão', 'SC', 'diretor',             'estadual',  1,  640,  7)
);

INSERT INTO negocios (lead_id, produto_id, etapa, valor_implantacao, valor_mensal, valor_avulso, created_at)
SELECT l.id, p.id, v.column2, v.column3, v.column4, 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-' || v.column5 || ' days')
FROM (VALUES
  ('[TESTE] Renata Oliveira', 'proposta', 1200000, 350000, 3),
  ('[TESTE] Sérgio Lima',     'contato',        0,  49900, 7)
) v
JOIN leads l    ON l.nome = v.column1
JOIN produtos p ON p.nome = 'GovEscolar';

-- Propostas abertas (e uma aceita) — vence_em é calculada pelo banco
INSERT INTO propostas (negocio_id, enviada_em, validade_dias, status)
SELECT n.id, date('now', '-3 hours', '-' || v.column2 || ' days'), v.column3, v.column4
FROM (VALUES
  ('[TESTE] Marina Costa',   27, 30, 'aberta'),   -- vence em 3 dias
  ('[TESTE] Aline Ribeiro',  24, 30, 'aberta'),   -- vence em 6 dias
  ('[TESTE] Gustavo Rocha',  10, 30, 'aberta'),   -- vence em 20 dias
  ('[TESTE] Paulo Henrique', 12, 15, 'aberta'),   -- vence em 3 dias
  ('[TESTE] Helena Vargas',  18, 30, 'aberta'),   -- vence em 12 dias
  ('[TESTE] Igor Nakamura',  20, 30, 'aceita')
) v
JOIN leads l    ON l.nome = v.column1
JOIN negocios n ON n.lead_id = l.id AND n.etapa <> 'perdido';

-- Tarefas de hoje: horário de São Paulo convertido para UTC
INSERT INTO tarefas (negocio_id, titulo, canal, data_hora, concluida)
SELECT (SELECT n.id FROM negocios n JOIN leads l ON l.id = n.lead_id WHERE l.nome = v.column1 AND n.etapa <> 'perdido'),
       v.column2, v.column3,
       strftime('%Y-%m-%dT%H:%M:00.000Z', date('now', '-3 hours') || ' ' || v.column4, '+3 hours'),
       v.column5
FROM (VALUES
  ('[TESTE] Carla Menezes',  '[TESTE] Primeiro contato com a federação',   'whatsapp',   '09:00', 1),
  ('[TESTE] Aline Ribeiro',  '[TESTE] Revisar valores da proposta',        'email',      '10:30', 0),
  ('[TESTE] Helena Vargas',  '[TESTE] Reunião de fechamento',              'video',      '14:00', 0),
  ('[TESTE] Paulo Henrique', '[TESTE] Retornar ligação da secretaria',     'ligacao',    '16:00', 0),
  ('[TESTE] Igor Nakamura',  '[TESTE] Emitir primeira cobrança',           'financeiro', '17:30', 0),
  (NULL,                     '[TESTE] Postar case no Instagram',           'whatsapp',   '18:00', 0)
) v;

-- Licenças ativas (clientes com mensalidade)
INSERT INTO licencas (lead_id, produto_id, valor_mensal, inicio, ultimo_reajuste_ipca, ativa)
SELECT l.id, p.id, v.column3, date('now', '-3 hours', '-' || v.column4 || ' days'), v.column5, v.column6
FROM (VALUES
  ('[TESTE] Igor Nakamura',  'Nuvox Academia',    19900,   3, NULL,         1),
  ('[TESTE] Kátia Souza',    'Nuvox Federações', 110000,  10, NULL,         1),
  ('[TESTE] Lucas Almeida',  'Nuvox Academia',    24900,  45, NULL,         1),
  ('[TESTE] Mônica Freitas', 'Nuvox Federações', 120000,  80, NULL,         1),
  ('[TESTE] Otávio Bezerra', 'Nuvox Academia',    19900, 400, '2026-01-15', 0)
) v
JOIN leads l    ON l.nome = v.column1
JOIN produtos p ON p.nome = v.column2;

-- Meta do mês atual: R$ 60.000,00
INSERT OR IGNORE INTO metas (mes, valor) VALUES (strftime('%Y-%m-01', 'now', '-3 hours'), 6000000);
