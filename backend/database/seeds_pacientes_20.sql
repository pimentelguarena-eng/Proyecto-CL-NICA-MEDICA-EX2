-- ============================================================================
-- SEEDS DE 20 PACIENTES, USUARIOS, ANTECEDENTES Y CITAS PREVIAS EXTENSAS
-- Contraseña estándar para todos los pacientes: Paciente123!
-- ============================================================================

BEGIN;

-- 1. Insertar o actualizar Rol Paciente
INSERT INTO roles (nombre, descripcion) VALUES ('Paciente', 'Acceso al portal de pacientes, reservas y expedientes') ON CONFLICT (nombre) DO NOTHING;

-- 2. Insertar los 20 Pacientes y sus Usuarios
-- Paciente PAC-001: María López Quispe
INSERT INTO usuarios (rol_id, username, correo, password_hash, salt, estado, created_at, updated_at)
SELECT id, 'maria.lopez@gmail.com', 'maria.lopez@gmail.com', 'e5c300b40830fe854913252da47160da92199461aa4bc67ea6c549fc124b2647e35747f91ff45cc3103dfd61cdf6a4f8b20903892ebb8b75d73e324acbd4159a', 'paciente_salt_2026', 'ACTIVO', NOW(), NOW()
FROM roles WHERE nombre = 'Paciente'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO pacientes (usuario_id, codigo, ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo, direccion, estado, created_at)
SELECT u.id, 'PAC-001', '5489123', 'María', 'López Quispe', '1992-04-15', 'F', '77341829', 'maria.lopez@gmail.com', 'Av. Las Américas #450, Barrio Central', 'ACTIVO', NOW()
FROM usuarios u WHERE u.correo = 'maria.lopez@gmail.com'
ON CONFLICT (ci) DO UPDATE SET direccion = EXCLUDED.direccion, telefono = EXCLUDED.telefono;

INSERT INTO antecedentes_medicos (paciente_id, grupo_sanguineo, alergias, patologias_cronicas, cirugias_previas, medicacion_habitual, contacto_emergencia_nombre, contacto_emergencia_telefono, updated_at)
SELECT p.id, 'O Positivo (O+)', 'Penicilina y derivados beta-lactámicos (produce angioedema)', 'Rinitis alérgica estacional perenne, Dismenorrea primaria', 'Apendicectomía laparoscópica no complicada a los 16 años (2008). Hospitalización por gastroenteritis aguda deshidratante en 2017. G1 P1 C0 A0. Antecedente familiar: Madre con HTA esencial.', 'Loratadina 10mg VO condicional, Ácido Mefenámico 500mg SOS menstrual', 'Jorge López Quispe', '76118920', NOW()
FROM pacientes p WHERE p.ci = '5489123'
ON CONFLICT (paciente_id) DO UPDATE SET alergias = EXCLUDED.alergias, patologias_cronicas = EXCLUDED.patologias_cronicas;

-- Paciente PAC-002: Carlos Fernández Rios
INSERT INTO usuarios (rol_id, username, correo, password_hash, salt, estado, created_at, updated_at)
SELECT id, 'carlos.fernandez@hotmail.com', 'carlos.fernandez@hotmail.com', 'e5c300b40830fe854913252da47160da92199461aa4bc67ea6c549fc124b2647e35747f91ff45cc3103dfd61cdf6a4f8b20903892ebb8b75d73e324acbd4159a', 'paciente_salt_2026', 'ACTIVO', NOW(), NOW()
FROM roles WHERE nombre = 'Paciente'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO pacientes (usuario_id, codigo, ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo, direccion, estado, created_at)
SELECT u.id, 'PAC-002', '6190432', 'Carlos', 'Fernández Rios', '1985-09-22', 'M', '70281930', 'carlos.fernandez@hotmail.com', 'Calle Sucre #120, Edificio Los Robles Depto 4B', 'ACTIVO', NOW()
FROM usuarios u WHERE u.correo = 'carlos.fernandez@hotmail.com'
ON CONFLICT (ci) DO UPDATE SET direccion = EXCLUDED.direccion, telefono = EXCLUDED.telefono;

INSERT INTO antecedentes_medicos (paciente_id, grupo_sanguineo, alergias, patologias_cronicas, cirugias_previas, medicacion_habitual, contacto_emergencia_nombre, contacto_emergencia_telefono, updated_at)
SELECT p.id, 'A Positivo (A+)', 'Ninguna alergia medicamentosa conocida', 'Hipertensión arterial estadio 2 (Esh/Esc), Prediabetes (Glucemia alterada en ayunas), Dislipidemia aterogénica mixta', 'Sin antecedentes quirúrgicos. Diagnosticado de HTA en 2021 durante chequeo laboral. Ex-fumador (5 cigarrillos/día durante 8 años, cesó en 2020). Sobrepeso IMC 29.4 kg/m2. Antecedente familiar: Padre fallecido por Infarto Agudo de Miocardio a los 58 años.', 'Losartán Potásico 50mg cada 12h, Hidroclorotiazida 12.5mg/día matutino, Metformina 850mg con almuerzo, Atorvastatina 20mg nocturno', 'Lucía Rios de Fernández', '71904421', NOW()
FROM pacientes p WHERE p.ci = '6190432'
ON CONFLICT (paciente_id) DO UPDATE SET alergias = EXCLUDED.alergias, patologias_cronicas = EXCLUDED.patologias_cronicas;

-- Paciente PAC-003: Andrea Montaño Suárez
INSERT INTO usuarios (rol_id, username, correo, password_hash, salt, estado, created_at, updated_at)
SELECT id, 'andrea.montano@outlook.com', 'andrea.montano@outlook.com', 'e5c300b40830fe854913252da47160da92199461aa4bc67ea6c549fc124b2647e35747f91ff45cc3103dfd61cdf6a4f8b20903892ebb8b75d73e324acbd4159a', 'paciente_salt_2026', 'ACTIVO', NOW(), NOW()
FROM roles WHERE nombre = 'Paciente'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO pacientes (usuario_id, codigo, ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo, direccion, estado, created_at)
SELECT u.id, 'PAC-003', '7823901', 'Andrea', 'Montaño Suárez', '1998-11-03', 'F', '75412903', 'andrea.montano@outlook.com', 'Av. Circunvalación #89, Condominio Sevilla', 'ACTIVO', NOW()
FROM usuarios u WHERE u.correo = 'andrea.montano@outlook.com'
ON CONFLICT (ci) DO UPDATE SET direccion = EXCLUDED.direccion, telefono = EXCLUDED.telefono;

INSERT INTO antecedentes_medicos (paciente_id, grupo_sanguineo, alergias, patologias_cronicas, cirugias_previas, medicacion_habitual, contacto_emergencia_nombre, contacto_emergencia_telefono, updated_at)
SELECT p.id, 'B Positivo (B+)', 'AINES (Ibuprofeno, Ketorolaco: causan broncoespasmo y urticaria generalizada)', 'Migraña episódica con aura visual típica, Miopía moderada y astigmatismo miópico compuesto', 'Cirugía refractiva corneal postergada. Frecuentes episodios de cefalea hemicraneana pulsátil invalidante con fotofobia y náuseas (promedio 3 crisis/mes). Resonancia Magnética Cerebral (2024) normal sin lesiones estructurales. Antecedente materno de migraña severa.', 'Sumatriptán 50mg VO al inicio del aura, Propanolol 40mg/día profiláctico, Lágrimas artificiales carboximetilcelulosa', 'Carmen Suárez Vda. de Montaño', '73901244', NOW()
FROM pacientes p WHERE p.ci = '7823901'
ON CONFLICT (paciente_id) DO UPDATE SET alergias = EXCLUDED.alergias, patologias_cronicas = EXCLUDED.patologias_cronicas;

-- Paciente PAC-004: Mateo Gutiérrez Aguilera
INSERT INTO usuarios (rol_id, username, correo, password_hash, salt, estado, created_at, updated_at)
SELECT id, 'mateo.gutierrez@gmail.com', 'mateo.gutierrez@gmail.com', 'e5c300b40830fe854913252da47160da92199461aa4bc67ea6c549fc124b2647e35747f91ff45cc3103dfd61cdf6a4f8b20903892ebb8b75d73e324acbd4159a', 'paciente_salt_2026', 'ACTIVO', NOW(), NOW()
FROM roles WHERE nombre = 'Paciente'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO pacientes (usuario_id, codigo, ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo, direccion, estado, created_at)
SELECT u.id, 'PAC-004', '8912450', 'Mateo', 'Gutiérrez Aguilera', '2019-06-14', 'M', '76991024', 'mateo.gutierrez@gmail.com', 'Urb. Las Palmas, Manzana 4, Lote 12', 'ACTIVO', NOW()
FROM usuarios u WHERE u.correo = 'mateo.gutierrez@gmail.com'
ON CONFLICT (ci) DO UPDATE SET direccion = EXCLUDED.direccion, telefono = EXCLUDED.telefono;

INSERT INTO antecedentes_medicos (paciente_id, grupo_sanguineo, alergias, patologias_cronicas, cirugias_previas, medicacion_habitual, contacto_emergencia_nombre, contacto_emergencia_telefono, updated_at)
SELECT p.id, 'O Positivo (O+)', 'Proteína de leche de vaca en la lactancia (superada), Ácaros del polvo y epitelio canino', 'Dermatitis atópica infantil moderada-severa, Asma bronquial intermitente', 'Nacido a término por parto eutócico, peso al nacer 3.400g, APGAR 9/10. Esquema de vacunación PAI completo al día. Episodio de bronquiolitis a los 9 meses requiriendo oxigenoterapia ambulatoria. Seguimiento pediátrico regular.', 'Crema emoliente con ceramidas 3 veces/día, Hidrocortisona tópica 1% en brotes SOS, Salbutamol aerosol 100mcg con aerocámara en crisis', 'René Gutiérrez Aguilera', '76991024', NOW()
FROM pacientes p WHERE p.ci = '8912450'
ON CONFLICT (paciente_id) DO UPDATE SET alergias = EXCLUDED.alergias, patologias_cronicas = EXCLUDED.patologias_cronicas;

-- Paciente PAC-005: Roberto Villarroel Paz
INSERT INTO usuarios (rol_id, username, correo, password_hash, salt, estado, created_at, updated_at)
SELECT id, 'roberto.villarroel@gmail.com', 'roberto.villarroel@gmail.com', 'e5c300b40830fe854913252da47160da92199461aa4bc67ea6c549fc124b2647e35747f91ff45cc3103dfd61cdf6a4f8b20903892ebb8b75d73e324acbd4159a', 'paciente_salt_2026', 'ACTIVO', NOW(), NOW()
FROM roles WHERE nombre = 'Paciente'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO pacientes (usuario_id, codigo, ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo, direccion, estado, created_at)
SELECT u.id, 'PAC-005', '4920183', 'Roberto', 'Villarroel Paz', '1970-02-18', 'M', '72819034', 'roberto.villarroel@gmail.com', 'Calle Bolívar #340, Zona Casco Viejo', 'ACTIVO', NOW()
FROM usuarios u WHERE u.correo = 'roberto.villarroel@gmail.com'
ON CONFLICT (ci) DO UPDATE SET direccion = EXCLUDED.direccion, telefono = EXCLUDED.telefono;

INSERT INTO antecedentes_medicos (paciente_id, grupo_sanguineo, alergias, patologias_cronicas, cirugias_previas, medicacion_habitual, contacto_emergencia_nombre, contacto_emergencia_telefono, updated_at)
SELECT p.id, 'AB Positivo (AB+)', 'Sulfamidas y trimetoprima (exantema maculopapular difuso)', 'Diabetes Mellitus tipo 2 no insulinodependiente (12 años de evolución), Hiperplasia Prostática Benigna (HPB) grado II, Retinopatía diabética no proliferativa leve', 'Colecistectomía convencional abierta en 2011 por colelitiasis sintomática. Tratamiento quirúrgico de hernia inguinal derecha con colocación de malla de polipropileno (2016). Última HbA1c: 7.2%. Fondo de ojo con microaneurismas aislados sin edema macular.', 'Metformina 850mg VO dos veces al día con comidas, Empagliflozina 10mg/día, Tamsulosina 0.4mg cada noche, Atorvastatina 20mg nocturno', 'Marta Villarroel Céspedes', '71994320', NOW()
FROM pacientes p WHERE p.ci = '4920183'
ON CONFLICT (paciente_id) DO UPDATE SET alergias = EXCLUDED.alergias, patologias_cronicas = EXCLUDED.patologias_cronicas;

-- Paciente PAC-006: Lucía Jimena Morales Céspedes
INSERT INTO usuarios (rol_id, username, correo, password_hash, salt, estado, created_at, updated_at)
SELECT id, 'lucia.morales@gmail.com', 'lucia.morales@gmail.com', 'e5c300b40830fe854913252da47160da92199461aa4bc67ea6c549fc124b2647e35747f91ff45cc3103dfd61cdf6a4f8b20903892ebb8b75d73e324acbd4159a', 'paciente_salt_2026', 'ACTIVO', NOW(), NOW()
FROM roles WHERE nombre = 'Paciente'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO pacientes (usuario_id, codigo, ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo, direccion, estado, created_at)
SELECT u.id, 'PAC-006', '5123984', 'Lucía Jimena', 'Morales Céspedes', '1981-08-30', 'F', '77109283', 'lucia.morales@gmail.com', 'Barrio Equipetrol, Calle 7 Este #15', 'ACTIVO', NOW()
FROM usuarios u WHERE u.correo = 'lucia.morales@gmail.com'
ON CONFLICT (ci) DO UPDATE SET direccion = EXCLUDED.direccion, telefono = EXCLUDED.telefono;

INSERT INTO antecedentes_medicos (paciente_id, grupo_sanguineo, alergias, patologias_cronicas, cirugias_previas, medicacion_habitual, contacto_emergencia_nombre, contacto_emergencia_telefono, updated_at)
SELECT p.id, 'A Positivo (A+)', 'Ácido acetilsalicílico (asma inducida por aspirina)', 'Artritis Reumatoide seropositiva (FR+, anti-CCP+), Osteopenia densitométrica de columna lumbar, Lumbalgia mecánica crónica', 'Diagnóstico de Artritis Reumatoide en 2019 tras poliartritis simétrica en manos y muñecas. Rigidez matinal de 45 minutos. Densitometría ósea T-Score -1.8 en L1-L4. Sesiones regulares de fisioterapia y kinesiología motora. Sin antecedentes quirúrgicos mayores.', 'Metotrexato 15mg semanal VO, Ácido fólico 5mg semanal (24h post-MTX), Prednisona 5mg/día matutino, Calcio 600mg + Vitamina D3 800 UI diarios', 'Gustavo Morales Céspedes', '77891200', NOW()
FROM pacientes p WHERE p.ci = '5123984'
ON CONFLICT (paciente_id) DO UPDATE SET alergias = EXCLUDED.alergias, patologias_cronicas = EXCLUDED.patologias_cronicas;

-- Paciente PAC-007: Fernando Javier Vaca Justiniano
INSERT INTO usuarios (rol_id, username, correo, password_hash, salt, estado, created_at, updated_at)
SELECT id, 'fernando.vaca@gmail.com', 'fernando.vaca@gmail.com', 'e5c300b40830fe854913252da47160da92199461aa4bc67ea6c549fc124b2647e35747f91ff45cc3103dfd61cdf6a4f8b20903892ebb8b75d73e324acbd4159a', 'paciente_salt_2026', 'ACTIVO', NOW(), NOW()
FROM roles WHERE nombre = 'Paciente'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO pacientes (usuario_id, codigo, ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo, direccion, estado, created_at)
SELECT u.id, 'PAC-007', '6389201', 'Fernando Javier', 'Vaca Justiniano', '1978-12-05', 'M', '78451290', 'fernando.vaca@gmail.com', 'Av. San Martín #820, Condominio Los Tajibos', 'ACTIVO', NOW()
FROM usuarios u WHERE u.correo = 'fernando.vaca@gmail.com'
ON CONFLICT (ci) DO UPDATE SET direccion = EXCLUDED.direccion, telefono = EXCLUDED.telefono;

INSERT INTO antecedentes_medicos (paciente_id, grupo_sanguineo, alergias, patologias_cronicas, cirugias_previas, medicacion_habitual, contacto_emergencia_nombre, contacto_emergencia_telefono, updated_at)
SELECT p.id, 'O Positivo (O+)', 'Mariscos y yodo concentrado (edema labial y prurito)', 'Enfermedad por Reflujo Gastroesofágico (ERGE) grado B de Los Ángeles, Gastritis crónica antral atrófica con erradicación previa de H. pylori, Hígado graso no alcohólico (Esteatosis hepática grado II)', 'Colecistectomía laparoscópica electiva en 2015. Endoscopía Digestiva Alta (julio 2025): esofagitis erosiva distal, hernia hiatal por deslizamiento de 2.5cm, biopsia gástrica negativa para H. pylori post-terapia cuádruple. Ecografía abdominal confirma esteatosis hepática difusa.', 'Esomeprazol 40mg en ayunas, Mosaprida 5mg antes de las principales comidas, Ácido ursodesoxicólico 250mg VO diario', 'Carla Justiniano de Vaca', '78901234', NOW()
FROM pacientes p WHERE p.ci = '6389201'
ON CONFLICT (paciente_id) DO UPDATE SET alergias = EXCLUDED.alergias, patologias_cronicas = EXCLUDED.patologias_cronicas;

-- Paciente PAC-008: Valeria Daniela Rojas Pinto
INSERT INTO usuarios (rol_id, username, correo, password_hash, salt, estado, created_at, updated_at)
SELECT id, 'valeria.rojas@gmail.com', 'valeria.rojas@gmail.com', 'e5c300b40830fe854913252da47160da92199461aa4bc67ea6c549fc124b2647e35747f91ff45cc3103dfd61cdf6a4f8b20903892ebb8b75d73e324acbd4159a', 'paciente_salt_2026', 'ACTIVO', NOW(), NOW()
FROM roles WHERE nombre = 'Paciente'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO pacientes (usuario_id, codigo, ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo, direccion, estado, created_at)
SELECT u.id, 'PAC-008', '7490123', 'Valeria Daniela', 'Rojas Pinto', '1995-03-27', 'F', '76321980', 'valeria.rojas@gmail.com', 'Calle Rene Moreno #512, Edificio Alborada', 'ACTIVO', NOW()
FROM usuarios u WHERE u.correo = 'valeria.rojas@gmail.com'
ON CONFLICT (ci) DO UPDATE SET direccion = EXCLUDED.direccion, telefono = EXCLUDED.telefono;

INSERT INTO antecedentes_medicos (paciente_id, grupo_sanguineo, alergias, patologias_cronicas, cirugias_previas, medicacion_habitual, contacto_emergencia_nombre, contacto_emergencia_telefono, updated_at)
SELECT p.id, 'A Negativo (A-)', 'Níquel y bisutería metálica (dermatitis de contacto eccematosa), Doxiciclina', 'Rosácea eritemato-telangiectásica y pápulo-pustulosa facial, Síndrome de colon irritable variante mixta', 'Sin antecedentes quirúrgicos. Tratamiento con láser vascular dermatológico en 2023 para telangiectasias malares con buena respuesta. Colonoscopía (2022) normal sin pólipos ni inflamación macroscópica. Antecedente familiar de hipotiroidismo materno.', 'Ivermectina crema 1% tópica nocturna, Gel limpiador syndet pH 5.5, Fotoprotector mineral SPF 50+ toque seco, Bromuro de pinaverio 100mg SOS dolor cólico', 'Patricia Pinto Vda. de Rojas', '76123980', NOW()
FROM pacientes p WHERE p.ci = '7490123'
ON CONFLICT (paciente_id) DO UPDATE SET alergias = EXCLUDED.alergias, patologias_cronicas = EXCLUDED.patologias_cronicas;

-- Paciente PAC-009: Hugo Ernesto Banzer Roca
INSERT INTO usuarios (rol_id, username, correo, password_hash, salt, estado, created_at, updated_at)
SELECT id, 'hugo.banzer@gmail.com', 'hugo.banzer@gmail.com', 'e5c300b40830fe854913252da47160da92199461aa4bc67ea6c549fc124b2647e35747f91ff45cc3103dfd61cdf6a4f8b20903892ebb8b75d73e324acbd4159a', 'paciente_salt_2026', 'ACTIVO', NOW(), NOW()
FROM roles WHERE nombre = 'Paciente'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO pacientes (usuario_id, codigo, ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo, direccion, estado, created_at)
SELECT u.id, 'PAC-009', '3981240', 'Hugo Ernesto', 'Banzer Roca', '1959-10-11', 'M', '71345678', 'hugo.banzer@gmail.com', 'Av. Cristóbal de Mendoza #1120, Barrio Sirari', 'ACTIVO', NOW()
FROM usuarios u WHERE u.correo = 'hugo.banzer@gmail.com'
ON CONFLICT (ci) DO UPDATE SET direccion = EXCLUDED.direccion, telefono = EXCLUDED.telefono;

INSERT INTO antecedentes_medicos (paciente_id, grupo_sanguineo, alergias, patologias_cronicas, cirugias_previas, medicacion_habitual, contacto_emergencia_nombre, contacto_emergencia_telefono, updated_at)
SELECT p.id, 'O Positivo (O+)', 'Dipirona / Metamizol (reacción de hipotensión severa)', 'Cardiopatía isquémica crónica revascularizada (Stent en arteria descendente anterior en 2023), Hipertensión arterial esencial grado 2, Insuficiencia venosa periférica crónica CEAP C4', 'Angioplastia coronaria transluminal percutánea con stent medicado con sirolimus tras Síndrome Coronario Agudo sin elevación ST en octubre de 2023. Ecocardiograma transtorácico de control (2025): FEVI 52%, hipocinesia anteroapical residual. Safenectomía izquierda parcial en 2012.', 'Aspirina 100mg/día con almuerzo, Clopidogrel 75mg/día, Carvedilol 12.5mg cada 12h, Enalapril 20mg cada 12h, Rosuvastatina 20mg noche, Diosmina + Hesperidina 500mg cada 12h', 'Gonzalo Banzer Roca', '71987654', NOW()
FROM pacientes p WHERE p.ci = '3981240'
ON CONFLICT (paciente_id) DO UPDATE SET alergias = EXCLUDED.alergias, patologias_cronicas = EXCLUDED.patologias_cronicas;

-- Paciente PAC-010: Camila Andrea Zeballos Hurtado
INSERT INTO usuarios (rol_id, username, correo, password_hash, salt, estado, created_at, updated_at)
SELECT id, 'camila.zeballos@gmail.com', 'camila.zeballos@gmail.com', 'e5c300b40830fe854913252da47160da92199461aa4bc67ea6c549fc124b2647e35747f91ff45cc3103dfd61cdf6a4f8b20903892ebb8b75d73e324acbd4159a', 'paciente_salt_2026', 'ACTIVO', NOW(), NOW()
FROM roles WHERE nombre = 'Paciente'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO pacientes (usuario_id, codigo, ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo, direccion, estado, created_at)
SELECT u.id, 'PAC-010', '8345672', 'Camila Andrea', 'Zeballos Hurtado', '2001-07-19', 'F', '75019284', 'camila.zeballos@gmail.com', 'Condominio Villa Toscana, Casa #48', 'ACTIVO', NOW()
FROM usuarios u WHERE u.correo = 'camila.zeballos@gmail.com'
ON CONFLICT (ci) DO UPDATE SET direccion = EXCLUDED.direccion, telefono = EXCLUDED.telefono;

INSERT INTO antecedentes_medicos (paciente_id, grupo_sanguineo, alergias, patologias_cronicas, cirugias_previas, medicacion_habitual, contacto_emergencia_nombre, contacto_emergencia_telefono, updated_at)
SELECT p.id, 'B Positivo (B+)', 'Ninguna conocida', 'Síndrome de Ovario Poliquístico (SOP) fenotipo A (hiperandrogenismo, oligoovulación y morfología poliquística), Resistencia a la insulina, Fibroadenoma mamario derecho (BIRADS 2)', 'Ecografía ginecológica transvaginal evidencia ovarios aumentados de volumen con más de 18 folículos periféricos subcentimétricos en collar de perlas. Ecografía mamaria bilateral confirma nódulo ovalado hipoecoico bien delimitado de 14x8mm compatible con fibroadenoma estable. Sin cirugías.', 'Anticonceptivo oral combinado (Drospirenona 3mg + Etinilestradiol 0.03mg), Metformina clorhidrato 500mg con cena, Mio-inositol 2000mg/día en sobres', 'Eduardo Zeballos Hurtado', '75990011', NOW()
FROM pacientes p WHERE p.ci = '8345672'
ON CONFLICT (paciente_id) DO UPDATE SET alergias = EXCLUDED.alergias, patologias_cronicas = EXCLUDED.patologias_cronicas;

-- Paciente PAC-011: Jorge Eduardo Salmón Ribera
INSERT INTO usuarios (rol_id, username, correo, password_hash, salt, estado, created_at, updated_at)
SELECT id, 'jorge.salmon@gmail.com', 'jorge.salmon@gmail.com', 'e5c300b40830fe854913252da47160da92199461aa4bc67ea6c549fc124b2647e35747f91ff45cc3103dfd61cdf6a4f8b20903892ebb8b75d73e324acbd4159a', 'paciente_salt_2026', 'ACTIVO', NOW(), NOW()
FROM roles WHERE nombre = 'Paciente'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO pacientes (usuario_id, codigo, ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo, direccion, estado, created_at)
SELECT u.id, 'PAC-011', '5789012', 'Jorge Eduardo', 'Salmón Ribera', '1988-05-14', 'M', '77654321', 'jorge.salmon@gmail.com', 'Calle 21 de Mayo #780, Zona Norte', 'ACTIVO', NOW()
FROM usuarios u WHERE u.correo = 'jorge.salmon@gmail.com'
ON CONFLICT (ci) DO UPDATE SET direccion = EXCLUDED.direccion, telefono = EXCLUDED.telefono;

INSERT INTO antecedentes_medicos (paciente_id, grupo_sanguineo, alergias, patologias_cronicas, cirugias_previas, medicacion_habitual, contacto_emergencia_nombre, contacto_emergencia_telefono, updated_at)
SELECT p.id, 'O Positivo (O+)', 'Tramadol (náuseas incoercibles y mareo severo)', 'Gonalgia post-reconstrucción ligamentaria de rodilla derecha, Condromalacia rotuliana grado II, Hipercolesterolemia leve', 'Artroscopía de rodilla derecha con plastia de Ligamento Cruzado Anterior con injerto hueso-tendón-hueso (HTH) y meniscectomía parcial medial en marzo de 2024 por traumatismo deportivo (fútbol). Cumplió 40 sesiones de fisioterapia y fortalecimiento de cuádriceps.', 'Glucosamina + Condroitina sulfato 1500/1200mg VO día, Colágeno hidrolizado tipo II 40mg, Paracetamol 1g condicional dolor articular', 'Gabriela Ribera de Salmón', '77123999', NOW()
FROM pacientes p WHERE p.ci = '5789012'
ON CONFLICT (paciente_id) DO UPDATE SET alergias = EXCLUDED.alergias, patologias_cronicas = EXCLUDED.patologias_cronicas;

-- Paciente PAC-012: Mariana Isabel Ardaya Méndez
INSERT INTO usuarios (rol_id, username, correo, password_hash, salt, estado, created_at, updated_at)
SELECT id, 'mariana.ardaya@gmail.com', 'mariana.ardaya@gmail.com', 'e5c300b40830fe854913252da47160da92199461aa4bc67ea6c549fc124b2647e35747f91ff45cc3103dfd61cdf6a4f8b20903892ebb8b75d73e324acbd4159a', 'paciente_salt_2026', 'ACTIVO', NOW(), NOW()
FROM roles WHERE nombre = 'Paciente'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO pacientes (usuario_id, codigo, ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo, direccion, estado, created_at)
SELECT u.id, 'PAC-012', '6890341', 'Mariana Isabel', 'Ardaya Méndez', '1994-09-08', 'F', '74890123', 'mariana.ardaya@gmail.com', 'Barrio Hamacas, Calle 4 Oeste #102', 'ACTIVO', NOW()
FROM usuarios u WHERE u.correo = 'mariana.ardaya@gmail.com'
ON CONFLICT (ci) DO UPDATE SET direccion = EXCLUDED.direccion, telefono = EXCLUDED.telefono;

INSERT INTO antecedentes_medicos (paciente_id, grupo_sanguineo, alergias, patologias_cronicas, cirugias_previas, medicacion_habitual, contacto_emergencia_nombre, contacto_emergencia_telefono, updated_at)
SELECT p.id, 'A Positivo (A+)', 'Ciprofloxacino (tendinitis aquílea bilateral)', 'Trastorno Depresivo Mayor recurrente en remisión parcial, Trastorno de Ansiedad Generalizada (TAG), Insomnio crónico de conciliación', 'Acompañamiento psicoterapéutico cognitivo-conductual desde 2023. Perfil tiroideo TSH y T4L dentro de rangos normales (descartado hipotiroidismo como causa secundaria). Electrocardiograma normal con intervalo QTc 410 ms. Sin antecedentes quirúrgicos.', 'Sertralina 100mg matutina, Clonazepam 0.5mg VO media tableta nocturna en desescalada, Melatonina de liberación prolongada 3mg', 'Carlos Ardaya Méndez', '74112233', NOW()
FROM pacientes p WHERE p.ci = '6890341'
ON CONFLICT (paciente_id) DO UPDATE SET alergias = EXCLUDED.alergias, patologias_cronicas = EXCLUDED.patologias_cronicas;

-- Paciente PAC-013: Alejandro Diego Balcázar Cuéllar
INSERT INTO usuarios (rol_id, username, correo, password_hash, salt, estado, created_at, updated_at)
SELECT id, 'alejandro.balcazar@gmail.com', 'alejandro.balcazar@gmail.com', 'e5c300b40830fe854913252da47160da92199461aa4bc67ea6c549fc124b2647e35747f91ff45cc3103dfd61cdf6a4f8b20903892ebb8b75d73e324acbd4159a', 'paciente_salt_2026', 'ACTIVO', NOW(), NOW()
FROM roles WHERE nombre = 'Paciente'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO pacientes (usuario_id, codigo, ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo, direccion, estado, created_at)
SELECT u.id, 'PAC-013', '7123459', 'Alejandro Diego', 'Balcázar Cuéllar', '1983-11-25', 'M', '71567890', 'alejandro.balcazar@gmail.com', 'Av. Beni entre 3er y 4to anillo #3100', 'ACTIVO', NOW()
FROM usuarios u WHERE u.correo = 'alejandro.balcazar@gmail.com'
ON CONFLICT (ci) DO UPDATE SET direccion = EXCLUDED.direccion, telefono = EXCLUDED.telefono;

INSERT INTO antecedentes_medicos (paciente_id, grupo_sanguineo, alergias, patologias_cronicas, cirugias_previas, medicacion_habitual, contacto_emergencia_nombre, contacto_emergencia_telefono, updated_at)
SELECT p.id, 'O Negativo (O-)', 'Polen de gramíneas y ácaros del polvo (rinitis alérgica severa)', 'Rinosinusitis crónica con pólipos nasales bilaterales (RSCcPN), Desviación septal nasal obstructiva cartilaginosa izquierda, Disfonía por fatiga vocal profesional', 'Microcirugía laríngea con exéresis de pólipo vocal en cuerda vocal izquierda en 2021. Tomografía computarizada de senos paranasales (2024): ocupación polipoidea en celdillas etmoidales anteriores y velamiento de seno maxilar izquierdo. Candidato a cirugía endoscópica nasosinusal (FESS).', 'Furoato de Mometasona spray nasal 50mcg (2 disparos en cada fosa nasal cada 24h), Lavados nasales con solución salina hipertónica 3%, Bilastina 20mg/día en ayunas', 'Ximena Cuéllar de Balcázar', '71445566', NOW()
FROM pacientes p WHERE p.ci = '7123459'
ON CONFLICT (paciente_id) DO UPDATE SET alergias = EXCLUDED.alergias, patologias_cronicas = EXCLUDED.patologias_cronicas;

-- Paciente PAC-014: Beatriz Esperanza Claure Soliz
INSERT INTO usuarios (rol_id, username, correo, password_hash, salt, estado, created_at, updated_at)
SELECT id, 'beatriz.claure@gmail.com', 'beatriz.claure@gmail.com', 'e5c300b40830fe854913252da47160da92199461aa4bc67ea6c549fc124b2647e35747f91ff45cc3103dfd61cdf6a4f8b20903892ebb8b75d73e324acbd4159a', 'paciente_salt_2026', 'ACTIVO', NOW(), NOW()
FROM roles WHERE nombre = 'Paciente'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO pacientes (usuario_id, codigo, ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo, direccion, estado, created_at)
SELECT u.id, 'PAC-014', '4567890', 'Beatriz Esperanza', 'Claure Soliz', '1968-06-30', 'F', '73456780', 'beatriz.claure@gmail.com', 'Av. Tres Pasos al Frente #540, Barrio San Antonio', 'ACTIVO', NOW()
FROM usuarios u WHERE u.correo = 'beatriz.claure@gmail.com'
ON CONFLICT (ci) DO UPDATE SET direccion = EXCLUDED.direccion, telefono = EXCLUDED.telefono;

INSERT INTO antecedentes_medicos (paciente_id, grupo_sanguineo, alergias, patologias_cronicas, cirugias_previas, medicacion_habitual, contacto_emergencia_nombre, contacto_emergencia_telefono, updated_at)
SELECT p.id, 'B Positivo (B+)', 'Amoxicilina / Clavulánico (ictericia colestásica inducida por fármaco en 2014)', 'Hipotiroidismo primario postquirúrgico, Obesidad grado I (IMC 31.8 kg/m2), Gonartrosis bilateral grado II (Kellgren-Lawrence)', 'Tiroidectomía total en 2013 por bocio multinodular gigante benigno con fenómeno compresivo traqueal. Ecografía de cuello de control (2024): lecho tiroideo libre de restos o adenopatías sospechosas. Último control de TSH: 2.1 mUI/L (eutiroidea compensada).', 'Levotiroxina sódica 100mcg VO diaria en ayunas estricta (mínimo 45 min antes del desayuno), Calcio elemental 500mg + Vit D3 400UI, Paracetamol 500mg condicional', 'Marcelo Claure Soliz', '73119988', NOW()
FROM pacientes p WHERE p.ci = '4567890'
ON CONFLICT (paciente_id) DO UPDATE SET alergias = EXCLUDED.alergias, patologias_cronicas = EXCLUDED.patologias_cronicas;

-- Paciente PAC-015: Daniel Gonzalo Prado Velasco
INSERT INTO usuarios (rol_id, username, correo, password_hash, salt, estado, created_at, updated_at)
SELECT id, 'daniel.prado@gmail.com', 'daniel.prado@gmail.com', 'e5c300b40830fe854913252da47160da92199461aa4bc67ea6c549fc124b2647e35747f91ff45cc3103dfd61cdf6a4f8b20903892ebb8b75d73e324acbd4159a', 'paciente_salt_2026', 'ACTIVO', NOW(), NOW()
FROM roles WHERE nombre = 'Paciente'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO pacientes (usuario_id, codigo, ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo, direccion, estado, created_at)
SELECT u.id, 'PAC-015', '6234567', 'Daniel Gonzalo', 'Prado Velasco', '1963-04-12', 'M', '72901234', 'daniel.prado@gmail.com', 'Calle Monseñor Rivero #380, Depto 602', 'ACTIVO', NOW()
FROM usuarios u WHERE u.correo = 'daniel.prado@gmail.com'
ON CONFLICT (ci) DO UPDATE SET direccion = EXCLUDED.direccion, telefono = EXCLUDED.telefono;

INSERT INTO antecedentes_medicos (paciente_id, grupo_sanguineo, alergias, patologias_cronicas, cirugias_previas, medicacion_habitual, contacto_emergencia_nombre, contacto_emergencia_telefono, updated_at)
SELECT p.id, 'A Positivo (A+)', 'Ninguna alergia conocida', 'Enfermedad Pulmonar Obstructiva Crónica (EPOC) estadio GOLD 2 Grupo B, Bronquiectasias cilíndricas basales bilaterales, Tabaquismo severo inactivo (Índice paquete-año: 35)', 'Espirometría post-broncodilatador (2025): FEV1/FVC 0.61, FEV1 64% del predicho con respuesta parcial al salbutamol. Vacunación antigripal y antineumocócica conjugada 13-valente y polisacárida 23-valente al día. Cesación tabáquica lograda en 2021.', 'Tiotropio bromuro 18mcg inhalador una vez al día por la mañana, Olodaterol + Fluticasona aerosol cada 12h, Acetilcisteína 600mg sobres diarios por 15 días mensuales', 'Sonia Velasco de Prado', '72887766', NOW()
FROM pacientes p WHERE p.ci = '6234567'
ON CONFLICT (paciente_id) DO UPDATE SET alergias = EXCLUDED.alergias, patologias_cronicas = EXCLUDED.patologias_cronicas;

-- Paciente PAC-016: Natalia Sofía Antelo Dorado
INSERT INTO usuarios (rol_id, username, correo, password_hash, salt, estado, created_at, updated_at)
SELECT id, 'natalia.antelo@gmail.com', 'natalia.antelo@gmail.com', 'e5c300b40830fe854913252da47160da92199461aa4bc67ea6c549fc124b2647e35747f91ff45cc3103dfd61cdf6a4f8b20903892ebb8b75d73e324acbd4159a', 'paciente_salt_2026', 'ACTIVO', NOW(), NOW()
FROM roles WHERE nombre = 'Paciente'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO pacientes (usuario_id, codigo, ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo, direccion, estado, created_at)
SELECT u.id, 'PAC-016', '7901234', 'Natalia Sofía', 'Antelo Dorado', '1975-01-22', 'F', '76549812', 'natalia.antelo@gmail.com', 'Calle Andrés Manso #210, Barrio Urbarí', 'ACTIVO', NOW()
FROM usuarios u WHERE u.correo = 'natalia.antelo@gmail.com'
ON CONFLICT (ci) DO UPDATE SET direccion = EXCLUDED.direccion, telefono = EXCLUDED.telefono;

INSERT INTO antecedentes_medicos (paciente_id, grupo_sanguineo, alergias, patologias_cronicas, cirugias_previas, medicacion_habitual, contacto_emergencia_nombre, contacto_emergencia_telefono, updated_at)
SELECT p.id, 'O Positivo (O+)', 'Betabloqueantes tópicos oftálmicos (Timolol: provocó bradicardia sinusal y broncoespasmo)', 'Glaucoma Primario de Ángulo Abierto bilateral (mayor compromiso en ojo derecho), Hipermetropía y presbicia corregidas, Cefalea tensional frecuente', 'Trabeculoplastia Láser Selectiva (SLT) en ojo derecho en noviembre de 2023 con reducción de Presión Intraocular (PIO) de 26 a 16 mmHg. Campimetría computarizada Humphrey 24-2 (2025): escotoma paracentral superior en OD y campo visual conservado en OI. Tomografía OCT de capa de fibras nerviosas de la retina.', 'Latanoprost 0.005% colirio: 1 gota en ambos ojos cada noche (21:00), Brimonidina 0.2% colirio: 1 gota cada 12h en ojo derecho, Gel lubricante ocular nocturno', 'Fabián Antelo Dorado', '76223344', NOW()
FROM pacientes p WHERE p.ci = '7901234'
ON CONFLICT (paciente_id) DO UPDATE SET alergias = EXCLUDED.alergias, patologias_cronicas = EXCLUDED.patologias_cronicas;

-- Paciente PAC-017: Ricardo Andrés Melgar Saucedo
INSERT INTO usuarios (rol_id, username, correo, password_hash, salt, estado, created_at, updated_at)
SELECT id, 'ricardo.melgar@gmail.com', 'ricardo.melgar@gmail.com', 'e5c300b40830fe854913252da47160da92199461aa4bc67ea6c549fc124b2647e35747f91ff45cc3103dfd61cdf6a4f8b20903892ebb8b75d73e324acbd4159a', 'paciente_salt_2026', 'ACTIVO', NOW(), NOW()
FROM roles WHERE nombre = 'Paciente'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO pacientes (usuario_id, codigo, ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo, direccion, estado, created_at)
SELECT u.id, 'PAC-017', '5345678', 'Ricardo Andrés', 'Melgar Saucedo', '1980-08-16', 'M', '78129045', 'ricardo.melgar@gmail.com', 'Av. Mutualista entre 2do y 3er anillo #2450', 'ACTIVO', NOW()
FROM usuarios u WHERE u.correo = 'ricardo.melgar@gmail.com'
ON CONFLICT (ci) DO UPDATE SET direccion = EXCLUDED.direccion, telefono = EXCLUDED.telefono;

INSERT INTO antecedentes_medicos (paciente_id, grupo_sanguineo, alergias, patologias_cronicas, cirugias_previas, medicacion_habitual, contacto_emergencia_nombre, contacto_emergencia_telefono, updated_at)
SELECT p.id, 'A Positivo (A+)', 'Penicilinas naturales (rash cutáneo urticariforme en la infancia)', 'Nefrolitiasis recidivante bilateral por oxalato de calcio, Hipercalciuria idiopática, Hiperuricemia asintomática (Ácido úrico sérico 8.4 mg/dL)', 'Dos sesiones de Litotricia Extracorpórea por Ondas de Choque (LEOCH) en 2020 y 2023 para cálculo renal derecho de 12mm y piélico izquierdo de 10mm. Urografía excretora y UROTAC evidencian adecuada función renal bilateral, sin ectasia urinaria residual ni litiasis coraliforme. Clearance de creatinina 98 mL/min.', 'Citrato de potasio sobres 10 mEq cada 8 horas disuelto en agua, Alopurinol 100mg/día tras el almuerzo, Hidroclorotiazida 25mg/día matutino para reducir calciuria, Consumo hídrico pautado > 2.5 L/día', 'Paola Saucedo de Melgar', '78776655', NOW()
FROM pacientes p WHERE p.ci = '5345678'
ON CONFLICT (paciente_id) DO UPDATE SET alergias = EXCLUDED.alergias, patologias_cronicas = EXCLUDED.patologias_cronicas;

-- Paciente PAC-018: Silvia Teresa Barba Landívar
INSERT INTO usuarios (rol_id, username, correo, password_hash, salt, estado, created_at, updated_at)
SELECT id, 'silvia.barba@gmail.com', 'silvia.barba@gmail.com', 'e5c300b40830fe854913252da47160da92199461aa4bc67ea6c549fc124b2647e35747f91ff45cc3103dfd61cdf6a4f8b20903892ebb8b75d73e324acbd4159a', 'paciente_salt_2026', 'ACTIVO', NOW(), NOW()
FROM roles WHERE nombre = 'Paciente'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO pacientes (usuario_id, codigo, ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo, direccion, estado, created_at)
SELECT u.id, 'PAC-018', '4890123', 'Silvia Teresa', 'Barba Landívar', '1987-10-09', 'F', '77239014', 'silvia.barba@gmail.com', 'Calle Warnes #315, Barrio Casco Antiguo', 'ACTIVO', NOW()
FROM usuarios u WHERE u.correo = 'silvia.barba@gmail.com'
ON CONFLICT (ci) DO UPDATE SET direccion = EXCLUDED.direccion, telefono = EXCLUDED.telefono;

INSERT INTO antecedentes_medicos (paciente_id, grupo_sanguineo, alergias, patologias_cronicas, cirugias_previas, medicacion_habitual, contacto_emergencia_nombre, contacto_emergencia_telefono, updated_at)
SELECT p.id, 'O Negativo (O-)', 'Cefalosporinas de primera generación (Cefalexina: erupción maculosa eritematosa)', 'Lupus Eritematoso Sistémico (LES) con compromiso cutáneo subagudo y articular (ANA 1:640 moteado, Anti-Ro/SSA positivo), Síndrome de Sjögren secundario (xeroftalmía y xerostomía moderadas), Fotosensibilidad severa', 'Biopsia de piel malar en 2018 compatible con lupus eritematoso discoide/subagudo. Evaluación renal semestral con sedimento urinario y proteinuria de 24 horas siempre negativa (< 150 mg/24h), descartando nefropatía lúpica activa. Examen de mácula libre de toxicidad retiniana por hidroxicloroquina.', 'Hidroxicloroquina sulfato 200mg/día con almuerzo (con control oftalmológico de campo visual anual), Prednisona 5mg/día matutino, Ciclosporina colirio 0.05% oftálmico cada 12h, Saliva artificial en spray bucal SOS', 'Mauricio Barba Landívar', '77334455', NOW()
FROM pacientes p WHERE p.ci = '4890123'
ON CONFLICT (paciente_id) DO UPDATE SET alergias = EXCLUDED.alergias, patologias_cronicas = EXCLUDED.patologias_cronicas;

-- Paciente PAC-019: Gabriel Ignacio Justiniano Chávez
INSERT INTO usuarios (rol_id, username, correo, password_hash, salt, estado, created_at, updated_at)
SELECT id, 'gabriel.justiniano@gmail.com', 'gabriel.justiniano@gmail.com', 'e5c300b40830fe854913252da47160da92199461aa4bc67ea6c549fc124b2647e35747f91ff45cc3103dfd61cdf6a4f8b20903892ebb8b75d73e324acbd4159a', 'paciente_salt_2026', 'ACTIVO', NOW(), NOW()
FROM roles WHERE nombre = 'Paciente'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO pacientes (usuario_id, codigo, ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo, direccion, estado, created_at)
SELECT u.id, 'PAC-019', '8123456', 'Gabriel Ignacio', 'Justiniano Chávez', '1997-02-04', 'M', '75890123', 'gabriel.justiniano@gmail.com', 'Av. Pirai #1400, Condominio Santa Mónica Casa 12', 'ACTIVO', NOW()
FROM usuarios u WHERE u.correo = 'gabriel.justiniano@gmail.com'
ON CONFLICT (ci) DO UPDATE SET direccion = EXCLUDED.direccion, telefono = EXCLUDED.telefono;

INSERT INTO antecedentes_medicos (paciente_id, grupo_sanguineo, alergias, patologias_cronicas, cirugias_previas, medicacion_habitual, contacto_emergencia_nombre, contacto_emergencia_telefono, updated_at)
SELECT p.id, 'B Positivo (B+)', 'Ninguna alergia medicamentosa referida', 'Hernia de disco lumbar L4-L5 y L5-S1 extruida subligamentaria posterolateral izquierda, Radiculopatía ciática S1 izquierda compresiva, Escoliosis postural dorsolumbar leve', 'Resonancia Magnética de Columna Lumbosacra (marzo 2025): hernia discal extruida en L5-S1 en contacto con la raíz S1 izquierda, con disminución del receso lateral. Tratamiento conservador instaurado con fisioterapia de tracción axial y fortalecimiento del core muscular. Infiltración epidural foraminal guiada por tomografía en 2024 con 80% de mejoría.', 'Pregabalina 75mg por la noche, Etoricoxib 90mg/día en episodios agudos de lumbociatalgia por máximo 7 días, Complejo Vitamina B1+B6+B12 intramuscular semanal en crisis', 'Liliana Chávez Vda. de Justiniano', '75112299', NOW()
FROM pacientes p WHERE p.ci = '8123456'
ON CONFLICT (paciente_id) DO UPDATE SET alergias = EXCLUDED.alergias, patologias_cronicas = EXCLUDED.patologias_cronicas;

-- Paciente PAC-020: Paula Andrea Monasterio Cronenbold
INSERT INTO usuarios (rol_id, username, correo, password_hash, salt, estado, created_at, updated_at)
SELECT id, 'paula.monasterio@gmail.com', 'paula.monasterio@gmail.com', 'e5c300b40830fe854913252da47160da92199461aa4bc67ea6c549fc124b2647e35747f91ff45cc3103dfd61cdf6a4f8b20903892ebb8b75d73e324acbd4159a', 'paciente_salt_2026', 'ACTIVO', NOW(), NOW()
FROM roles WHERE nombre = 'Paciente'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO pacientes (usuario_id, codigo, ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo, direccion, estado, created_at)
SELECT u.id, 'PAC-020', '6789012', 'Paula Andrea', 'Monasterio Cronenbold', '1993-12-18', 'F', '76192834', 'paula.monasterio@gmail.com', 'Barrio Sirari, Calle Los Gomeros #88', 'ACTIVO', NOW()
FROM usuarios u WHERE u.correo = 'paula.monasterio@gmail.com'
ON CONFLICT (ci) DO UPDATE SET direccion = EXCLUDED.direccion, telefono = EXCLUDED.telefono;

INSERT INTO antecedentes_medicos (paciente_id, grupo_sanguineo, alergias, patologias_cronicas, cirugias_previas, medicacion_habitual, contacto_emergencia_nombre, contacto_emergencia_telefono, updated_at)
SELECT p.id, 'A Positivo (A+)', 'Gluten / Trigo / Cebada / Centeno (Enteropatía sensible al gluten confirmada)', 'Enfermedad Celíaca del adulto (Clasificación Marsh 3c con atrofia vellositaria total), Anemia ferropénica secundaria por malabsorción intestinal crónica, Osteopenia perimenopáusica prematura', 'Endoscopía digestiva alta con biopsias múltiples de bulbo y segunda porción duodenal en 2022: marcada atrofia de vellosidades intestinales, hiperplasia de criptas e incremento de linfocitos intraepiteliales (> 40 LIES/100 enterocitos). Serología anti-transglutaminasa tisular IgA inicial > 200 U/mL (actualmente negativizada tras estricta adherencia nutricional). Ferritina normalizada.', 'Hierro sacarato intravenoso en ciclos semestrales, Colecalciferol (Vit D3) 50.000 UI mensual, Dieta libre de gluten estricta al 100% de por vida (ausencia total de contaminación cruzada), Suplemento multivitamínico con zinc y ácido fólico', 'Mariana Cronenbold de Monasterio', '76998877', NOW()
FROM pacientes p WHERE p.ci = '6789012'
ON CONFLICT (paciente_id) DO UPDATE SET alergias = EXCLUDED.alergias, patologias_cronicas = EXCLUDED.patologias_cronicas;

COMMIT;