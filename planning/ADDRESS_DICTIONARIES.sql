CREATE TABLE `countries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL,
  `abbreviation` varchar(5) NOT NULL,
  `mhCode` varchar(5) NOT NULL,
  `isActive` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
);

INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('Afganistán','AF','AF',1),
	 ('Aland','AX','AX',1),
	 ('Albania','AL','AL',1),
	 ('Alemania','DE','DE',1),
	 ('Andorra','AD','AD',1),
	 ('Angola','AO','AO',1),
	 ('Anguila','AI','AI',1),
	 ('Antártica','AQ','AQ',1),
	 ('Antigua y Barbuda','AG','AG',1),
	 ('Aruba','AW','AW',1);
INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('Arabia Saudita','SA','SA',1),
	 ('Argelia','DZ','DZ',1),
	 ('Argentina','AR','AR',1),
	 ('Armenia','AM','AM',1),
	 ('Australia','AU','AU',1),
	 ('Austria','AT','AT',1),
	 ('Azerbaiyán','AZ','AZ',1),
	 ('Bahamas','BS','BS',1),
	 ('Bahrein','BH','BH',1),
	 ('Bangladesh','BD','BD',1);
INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('Barbados','BB','BB',1),
	 ('Bélgica','BE','BE',1),
	 ('Belice','BZ','BZ',1),
	 ('Benin','BJ','BJ',1),
	 ('Bermudas','BM','BM',1),
	 ('Bielorrusia','BY','BY',1),
	 ('Bolivia','BO','BO',1),
	 ('Bonaire, Sint Eustatius and Saba','BQ','BQ',1),
	 ('Bosnia-Herzegovina','BA','BA',1),
	 ('Botswana','BW','BW',1);
INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('Brasil','BR','BR',1),
	 ('Brunei','BN','BN',1),
	 ('Bulgaria','BG','BG',1),
	 ('Burkina Faso','BF','BF',1),
	 ('Burundi','BI','BI',1),
	 ('Bután','BT','BT',1),
	 ('Cabo Verde','CV','CV',1),
	 ('Caimán, Islas','KY','KY',1),
	 ('Camboya','KH','KH',1),
	 ('Camerún','CM','CM',1);
INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('Canadá','CA','CA',1),
	 ('Centroafricana, República','CF','CF',1),
	 ('Chad','TD','TD',1),
	 ('Chile','CL','CL',1),
	 ('China','CN','CN',1),
	 ('Chipre','CY','CY',1),
	 ('Ciudad del Vaticano','VA','VA',1),
	 ('Colombia','CO','CO',1),
	 ('Comoras','KM','KM',1),
	 ('Congo','CG','CG',1);
INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('Costa de Marfil','CI','CI',1),
	 ('Costa Rica','CR','CR',1),
	 ('Croacia','HR','HR',1),
	 ('Cuba','CU','CU',1),
	 ('Curazao','CW','CW',1),
	 ('Dinamarca','DK','DK',1),
	 ('Dominica','DM','DM',1),
	 ('Djiboutí','DJ','DJ',1),
	 ('Ecuador','EC','EC',1),
	 ('Egipto','EG','EG',1);
INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('El Salvador','SV','SV',1),
	 ('Emiratos Árabes Unidos','AE','AE',1),
	 ('Eritrea','ER','ER',1),
	 ('Eslovaquia','SK','SK',1),
	 ('Eslovenia','SI','SI',1),
	 ('España','ES','ES',1),
	 ('Estados Unidos','US','US',1),
	 ('Estonia','EE','EE',1),
	 ('Etiopía','ET','ET',1),
	 ('Fiji','FJ','FJ',1);
INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('Filipinas','PH','PH',1),
	 ('Finlandia','FI','FI',1),
	 ('Francia','FR','FR',1),
	 ('Gabón','GA','GA',1),
	 ('Gambia','GM','GM',1),
	 ('Georgia','GE','GE',1),
	 ('Ghana','GH','GH',1),
	 ('Gibraltar','GI','GI',1),
	 ('Granada','GD','GD',1),
	 ('Grecia','GR','GR',1);
INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('Groenlandia','GL','GL',1),
	 ('Guadalupe','GP','GP',1),
	 ('Guam','GU','GU',1),
	 ('Guatemala','GT','GT',1),
	 ('Guayana Francesa','GF','GF',1),
	 ('Guernsey','GG','GG',1),
	 ('Guinea','GN','GN',1),
	 ('Guinea Ecuatorial','GQ','GQ',1),
	 ('Guinea-Bissau','GW','GW',1),
	 ('Guyana','GY','GY',1);
INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('Haití','HT','HT',1),
	 ('Honduras','HN','HN',1),
	 ('Hong Kong','HK','HK',1),
	 ('Hungría','HU','HU',1),
	 ('India','IN','IN',1),
	 ('Indonesia','ID','ID',1),
	 ('Irak','IQ','IQ',1),
	 ('Irlanda','IE','IE',1),
	 ('Isla Bouvet','BV','BV',1),
	 ('Isla de Man','IM','IM',1);
INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('Isla Norfolk','NF','NF',1),
	 ('Islandia','IS','IS',1),
	 ('Islas Navidad','CX','CX',1),
	 ('Islas Cocos','CC','CC',1),
	 ('Islas Cook','CK','CK',1),
	 ('Islas Faroe','FO','FO',1),
	 ('Islas Georgias d. S.-Sandwich d. S.','GS','GS',1),
	 ('Islas Heard y McDonald','HM','HM',1),
	 ('Islas Malvinas (Falkland)','FK','FK',1),
	 ('Islas Marianas del Norte','MP','MP',1);
INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('Islas Marshall','MH','MH',1),
	 ('Islas Pitcairn','PN','PN',1),
	 ('Islas Turcas y Caicos','TC','TC',1),
	 ('Islas Ultramarinas de E.E.U.U','UM','UM',1),
	 ('Islas Vírgenes','VI','VI',1),
	 ('Israel','IL','IL',1),
	 ('Italia','IT','IT',1),
	 ('Jamaica','JM','JM',1),
	 ('Japón','JP','JP',1),
	 ('Jersey','JE','JE',1);
INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('Jordania','JO','JO',1),
	 ('Kazajistán','KZ','KZ',1),
	 ('Kenia','KE','KE',1),
	 ('Kirguistán','KG','KG',1),
	 ('Kiribati','KI','KI',1),
	 ('Kuwait','KW','KW',1),
	 ('Laos, República Democrática','LA','LA',1),
	 ('Lesotho','LS','LS',1),
	 ('Letonia','LV','LV',1),
	 ('Líbano','LB','LB',1);
INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('Liberia','LR','LR',1),
	 ('Libia','LY','LY',1),
	 ('Liechtenstein','LI','LI',1),
	 ('Lituania','LT','LT',1),
	 ('Luxemburgo','LU','LU',1),
	 ('Macao','MO','MO',1),
	 ('Macedonia','MK','MK',1),
	 ('Madagascar','MG','MG',1),
	 ('Malasia','MY','MY',1),
	 ('Malawi','MW','MW',1);
INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('Maldivas','MV','MV',1),
	 ('Malí','ML','ML',1),
	 ('Malta','MT','MT',1),
	 ('Marruecos','MA','MA',1),
	 ('Martinica e.a.','MQ','MQ',1),
	 ('Mauricio','MU','MU',1),
	 ('Mauritania','MR','MR',1),
	 ('Mayotte','YT','YT',1),
	 ('México','MX','MX',1),
	 ('Micronesia','FM','FM',1);
INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('Moldavia, República de','MD','MD',1),
	 ('Mónaco','MC','MC',1),
	 ('Mongolia','MN','MN',1),
	 ('Montenegro','ME','ME',1),
	 ('Montserrat','MS','MS',1),
	 ('Mozambique','MZ','MZ',1),
	 ('Myanmar','MM','MM',1),
	 ('Namibia','NA','NA',1),
	 ('Nauru','NR','NR',1),
	 ('Nepal','NP','NP',1);
INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('Nicaragua','NI','NI',1),
	 ('Níger','NE','NE',1),
	 ('Nigeria','NG','NG',1),
	 ('Niue','NU','NU',1),
	 ('Noruega','NO','NO',1),
	 ('Nueva Caledonia','NC','NC',1),
	 ('Nueva Zelanda','NZ','NZ',1),
	 ('Omán','OM','OM',1),
	 ('Países Bajos','NL','NL',1),
	 ('Pakistán','PK','PK',1);
INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('Palaos','PW','PW',1),
	 ('Palestina','PS','PS',1),
	 ('Panamá','PA','PA',1),
	 ('Papúa, Nueva Guinea','PG','PG',1),
	 ('Paraguay','PY','PY',1),
	 ('Perú','PE','PE',1),
	 ('Polinesia Francesa','PF','PF',1),
	 ('Polonia','PL','PL',1),
	 ('Portugal','PT','PT',1),
	 ('Puerto Rico','PR','PR',1);
INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('Qatar','QA','QA',1),
	 ('Reino Unido','GB','GB',1),
	 ('Rep. Democrática popular de Corea','KP','KP',1),
	 ('República Checa','CZ','CZ',1),
	 ('República de Corea','KR','KR',1),
	 ('República Democrática del Congo','CD','CD',1),
	 ('República Dominicana','DO','DO',1),
	 ('República Islámica de Irán','IR','IR',1),
	 ('Reunión','RE','RE',1),
	 ('Ruanda','RW','RW',1);
INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('Rumania','RO','RO',1),
	 ('Rusia','RU','RU',1),
	 ('Sahara Occidental','EH','EH',1),
	 ('Saint Barthélemy','BL','BL',1),
	 ('Saint Martin (French part)','MF','MF',1),
	 ('Salomón, Islas','SB','SB',1),
	 ('Samoa','WS','WS',1),
	 ('Samoa Americana','AS','AS',1),
	 ('San Cristóbal y Nieves','KN','KN',1),
	 ('San Marino','SM','SM',1);
INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('San Pedro y Miquelón','PM','PM',1),
	 ('San Vicente y las Granadinas','VC','VC',1),
	 ('Santa Elena','SH','SH',1),
	 ('Santa Lucía','LC','LC',1),
	 ('Santo Tomé y Príncipe','ST','ST',1),
	 ('Senegal','SN','SN',1),
	 ('Serbia','RS','RS',1),
	 ('Seychelles','SC','SC',1),
	 ('Sierra Leona','SL','SL',1),
	 ('Singapur','SG','SG',1);
INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('Sint Maarten (Dutch part)','SX','SX',1),
	 ('Siria','SY','SY',1),
	 ('Somalia','SO','SO',1),
	 ('South Sudan','SS','SS',1),
	 ('Sri Lanka','LK','LK',1),
	 ('Sudáfrica','ZA','ZA',1),
	 ('Sudán','SD','SD',1),
	 ('Suecia','SE','SE',1),
	 ('Suiza','CH','CH',1),
	 ('Surinám','SR','SR',1);
INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('Svalbard y Jan Mayen','SJ','SJ',1),
	 ('Swazilandia','SZ','SZ',1),
	 ('Tailandia','TH','TH',1),
	 ('Taiwan, Provincia de China','TW','TW',1),
	 ('Tanzania, República Unida de','TZ','TZ',1),
	 ('Tayikistán','TJ','TJ',1),
	 ('Territorio Británico Océano Indico','IO','IO',1),
	 ('Territorios Australes Franceses','TF','TF',1),
	 ('Timor Oriental','TL','TL',1),
	 ('Togo','TG','TG',1);
INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('Tokelau','TK','TK',1),
	 ('Tonga','TO','TO',1),
	 ('Trinidad y Tobago','TT','TT',1),
	 ('Túnez','TN','TN',1),
	 ('Turkmenistán','TM','TM',1),
	 ('Turquía','TR','TR',1),
	 ('Tuvalu','TV','TV',1),
	 ('Ucrania','UA','UA',1),
	 ('Uganda','UG','UG',1),
	 ('Uruguay','UY','UY',1);
INSERT INTO countries (name,abbreviation,mhCode,isActive) VALUES
	 ('Uzbekistán','UZ','UZ',1),
	 ('Vanuatu','VU','VU',1),
	 ('Venezuela','VE','VE',1),
	 ('Vietnam','VN','VN',1),
	 ('Islas Vírgenes Británicas','VG','VG',1),
	 ('Wallis y Fortuna, Islas','WF','WF',1),
	 ('Yemen','YE','YE',1),
	 ('Zambia','ZM','ZM',1),
	 ('Zimbabue','ZW','ZW',1);

CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `abbreviation` varchar(10) NOT NULL,
  `mhCode` varchar(5) NOT NULL,
  `zone` tinyint NOT NULL,
  `isActive` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
);

INSERT INTO departments (name,abbreviation,mhCode,`zone`,isActive) VALUES
	 ('Otro (Para extranjeros)','SV-OT','00',0,1),
	 ('AHUACHAPAN','SV-AH','01',1,1),
	 ('SANTA ANA','SV-SA','02',1,1),
	 ('SONSONATE','SV-SO','03',1,1),
	 ('LA LIBERTAD','SV-LI','05',2,1),
	 ('CHALATENANGO','SV-CH','04',2,1),
	 ('SAN SALVADOR','SV-SS','06',2,1),
	 ('CUSCATLAN','SV-CU','07',3,1),
	 ('LA PAZ','SV-PA','08',3,1),
	 ('CABANAS','SV-CA','09',3,1);
INSERT INTO departments (name,abbreviation,mhCode,`zone`,isActive) VALUES
	 ('SAN VICENTE','SV-SV','10',3,1),
	 ('USULUTAN','SV-US','11',4,1),
	 ('MORAZAN','SV-MO','13',4,1),
	 ('SAN MIGUEL','SV-SM','12',4,1),
	 ('LA UNION','SV-UN','14',4,1);

CREATE TABLE `cities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `departmentId` int NOT NULL,
  `name` varchar(30) NOT NULL,
  `mhCode` varchar(5) NOT NULL,
  `isActive` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `departmentId` (`departmentId`),
  CONSTRAINT `cities_ibfk_1` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`)
);

INSERT INTO cities (departmentId,name,mhCode,isActive) VALUES
	 (0,'Otro (Para Extranjeros)','00',1),
	 (1,'AHUACHAPAN NORTE','13',1),
	 (1,'AHUACHAPAN CENTRO','14',1),
	 (1,'AHUACHAPAN SUR','15',1),
	 (2,'SANTA ANA NORTE','14',1),
	 (2,'SANTA ANA CENTRO','15',1),
	 (2,'SANTA ANA ESTE','16',1),
	 (2,'SANTA ANA OESTE','17',1),
	 (3,'SONSONATE NORTE','17',1),
	 (3,'SONSONATE CENTRO','18',1);
INSERT INTO cities (departmentId,name,mhCode,isActive) VALUES
	 (3,'SONSONATE ESTE','19',1),
	 (3,'SONSONATE OESTE','20',1),
	 (4,'LA LIBERTAD NORTE','23',1),
	 (4,'LA LIBERTAD CENTRO','24',1),
	 (4,'LA LIBERTAD OESTE','25',1),
	 (4,'LA LIBERTAD ESTE','26',1),
	 (4,'LA LIBERTAD COSTA','27',1),
	 (4,'LA LIBERTAD SUR','28',1),
	 (5,'CHALATENANGO NORTE','34',1),
	 (5,'CHALATENANGO CENTRO','35',1);
INSERT INTO cities (departmentId,name,mhCode,isActive) VALUES
	 (5,'CHALATENANGO SUR','36',1),
	 (6,'SAN SALVADOR NORTE','20',1),
	 (6,'SAN SALVADOR OESTE','21',1),
	 (6,'SAN SALVADOR ESTE','22',1),
	 (6,'SAN SALVADOR CENTRO','23',1),
	 (6,'SAN SALVADOR SUR','24',1),
	 (7,'CUSCATLAN NORTE','17',1),
	 (7,'CUSCATLAN SUR','18',1),
	 (8,'LA PAZ OESTE','23',1),
	 (8,'LA PAZ CENTRO','24',1);
INSERT INTO cities (departmentId,name,mhCode,isActive) VALUES
	 (8,'LA PAZ ESTE','25',1),
	 (9,'CABANAS OESTE','10',1),
	 (9,'CABANAS ESTE','11',1),
	 (10,'SAN VICENTE NORTE','14',1),
	 (10,'SAN VICENTE SUR','15',1),
	 (11,'USULUTAN NORTE','24',1),
	 (11,'USULUTAN ESTE','25',1),
	 (11,'USULUTAN OESTE','26',1),
	 (12,'MORAZAN NORTE','27',1),
	 (12,'MORAZAN SUR','28',1);
INSERT INTO cities (departmentId,name,mhCode,isActive) VALUES
	 (13,'SAN MIGUEL NORTE','21',1),
	 (13,'SAN MIGUEL CENTRO','22',1),
	 (13,'SAN MIGUEL OESTE','23',1),
	 (14,'LA UNION NORTE','19',1),
	 (14,'LA UNION SUR','20',1);

CREATE TABLE `districts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cityId` int NOT NULL,
  `name` varchar(30) NOT NULL,
  `mhCode` varchar(5) NOT NULL,
  `isActive` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `cityId` (`cityId`),
  CONSTRAINT `districts_ibfk_1` FOREIGN KEY (`cityId`) REFERENCES `cities` (`id`)
);

INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (0,'OTRO (PARA EXTRANJEROS)','00',1),
	 (264,'AHUACHAPAN','01',1),
	 (265,'JUJUTLA','07',1),
	 (263,'ATIQUIZAYA','03',1),
	 (264,'CONCEPCION DE ATACO','04',1),
	 (263,'EL REFUGIO','05',1),
	 (265,'GUAYMANGO','06',1),
	 (264,'APANECA','02',1),
	 (265,'SAN FRANCISCO MENENDEZ','08',1),
	 (263,'SAN LORENZO (AHUACHAPAN)','09',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (265,'SAN PEDRO PUXTLA','10',1),
	 (264,'TACUBA','11',1),
	 (263,'TURIN','12',1),
	 (269,'CANDELARIA DE LA FRONTERA','01',1),
	 (269,'CHALCHUAPA','03',1),
	 (268,'COATEPEQUE','02',1),
	 (268,'EL CONGO','04',1),
	 (269,'EL PORVENIR','05',1),
	 (266,'MASAHUAT','06',1),
	 (266,'METAPAN','07',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (269,'SAN ANTONIO PAJONAL','08',1),
	 (269,'SAN SEBASTIAN SALITRILLO','09',1),
	 (267,'SANTA ANA','10',1),
	 (266,'SANTA ROSA GUACHIPILIN','11',1),
	 (269,'SANTIAGO DE LA FRONTERA','12',1),
	 (266,'TEXISTEPEQUE','13',1),
	 (273,'ACAJUTLA','01',1),
	 (272,'ARMENIA','02',1),
	 (272,'CALUCO','03',1),
	 (272,'CUISNAHUAT','04',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (272,'IZALCO','06',1),
	 (270,'JUAYUA','07',1),
	 (270,'NAHUIZALCO','08',1),
	 (271,'NAHULINGO','09',1),
	 (270,'SALCOATITAN','10',1),
	 (271,'SAN ANTONIO DEL MONTE','11',1),
	 (272,'SAN JULIAN','12',1),
	 (270,'SANTA CATARINA MASAHUAT','13',1),
	 (272,'SANTA ISABEL ISHUATAN','05',1),
	 (271,'SANTO DOMINGO DE GUZMAN','14',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (271,'SONSONATE','15',1),
	 (271,'SONZACATE','16',1),
	 (277,'ANTIGUO CUSCATLAN','01',1),
	 (278,'CHILTIUPAN','05',1),
	 (275,'CIUDAD ARCE','02',1),
	 (276,'COLON','03',1),
	 (279,'COMASAGUA','04',1),
	 (277,'HUIZUCAR','06',1),
	 (276,'JAYAQUE','07',1),
	 (278,'JICALAPA','08',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (278,'LA LIBERTAD','09',1),
	 (279,'SANTA TECLA','11',1),
	 (277,'NUEVO CUSCATLAN','10',1),
	 (275,'SAN JUAN OPICO','15',1),
	 (274,'QUEZALTEPEQUE','12',1),
	 (276,'SACACOYO','13',1),
	 (277,'SAN JOSE VILLANUEVA','14',1),
	 (274,'SAN MATIAS','16',1),
	 (274,'SAN PABLO TACACHICO','17',1),
	 (276,'TALNIQUE','18',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (278,'TAMANIQUE','19',1),
	 (278,'TEOTEPEQUE','20',1),
	 (276,'TEPECOYO','21',1),
	 (277,'ZARAGOZA','22',1),
	 (281,'AGUA CALIENTE','01',1),
	 (282,'ARCATAO','02',1),
	 (282,'AZACUALPA','03',1),
	 (282,'CANCASQUE','27',1),
	 (282,'CHALATENANGO','07',1),
	 (280,'CITALA','04',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (282,'COMAPALA','05',1),
	 (282,'CONCEPCION QUEZALTEPEQUE','06',1),
	 (281,'DULCE NOMBRE DE MARIA','08',1),
	 (282,'EL CARRIZAL','09',1),
	 (281,'EL PARAISO','10',1),
	 (282,'LA LAGUNA','11',1),
	 (280,'LA PALMA','12',1),
	 (281,'LA REINA','13',1),
	 (282,'LAS VUELTAS','14',1),
	 (281,'NUEVA CONCEPCION','16',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (282,'NUEVA TRINIDAD','17',1),
	 (282,'NOMBRE DE JESUS','15',1),
	 (282,'OJOS DE AGUA','18',1),
	 (282,'POTONICO','19',1),
	 (282,'SAN ANTONIO DE LA CRUZ','20',1),
	 (282,'SAN ANTONIO LOS RANCHOS','21',1),
	 (281,'SAN FERNANDO (CHALATENANGO)','22',1),
	 (282,'SAN FRANCISCO LEMPA','23',1),
	 (281,'SAN FRANCISCO MORAZAN','24',1),
	 (280,'SAN IGNACIO','25',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (282,'SAN ISIDRO LABRADOR','26',1),
	 (282,'LAS FLORES','28',1),
	 (282,'SAN LUIS DEL CARMEN','29',1),
	 (282,'SAN MIGUEL DE MERCEDES','30',1),
	 (281,'SAN RAFAEL','31',1),
	 (281,'SANTA RITA','32',1),
	 (281,'TEJUTLA','33',1),
	 (283,'AGUILARES','01',1),
	 (284,'APOPA','02',1),
	 (286,'AYUTUXTEPEQUE','03',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (286,'CUSCATANCINGO','04',1),
	 (286,'CIUDAD DELGADO','19',1),
	 (283,'EL PAISNAL','05',1),
	 (283,'GUAZAPA','06',1),
	 (285,'ILOPANGO','07',1),
	 (286,'MEJICANOS','08',1),
	 (284,'NEJAPA','09',1),
	 (287,'PANCHIMALCO','10',1),
	 (287,'ROSARIO DE MORA','11',1),
	 (287,'SAN MARCOS','12',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (285,'SAN MARTIN','13',1),
	 (286,'SAN SALVADOR','14',1),
	 (287,'SANTIAGO TEXACUANGOS','15',1),
	 (287,'SANTO TOMAS','16',1),
	 (285,'SOYAPANGO','17',1),
	 (285,'TONACATEPEQUE','18',1),
	 (289,'COJUTEPEQUE','02',1),
	 (289,'CANDELARIA','01',1),
	 (289,'EL CARMEN (CUSCATLAN)','03',1),
	 (289,'EL ROSARIO (CUSCATLAN)','04',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (289,'MONTE SAN JUAN','05',1),
	 (288,'ORATORIO DE CONCEPCION','06',1),
	 (288,'SAN BARTOLOME PERULAPIA','07',1),
	 (289,'SAN CRISTOBAL','08',1),
	 (288,'SAN JOSE GUAYABAL','09',1),
	 (288,'SAN PEDRO PERULAPAN','10',1),
	 (289,'SAN RAFAEL CEDROS','11',1),
	 (289,'SAN RAMON','12',1),
	 (289,'SANTA CRUZ ANALQUITO','13',1),
	 (289,'SANTA CRUZ MICHAPA','14',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (288,'SUCHITOTO','15',1),
	 (289,'TENANCINGO','16',1),
	 (292,'ZACATECOLUCA','21',1),
	 (290,'CUYULTITAN','01',1),
	 (291,'EL ROSARIO (LA PAZ)','02',1),
	 (291,'JERUSALEN','03',1),
	 (291,'MERCEDES LA CEIBA','04',1),
	 (290,'OLOCUILTA','05',1),
	 (291,'PARAISO DE OSORIO','06',1),
	 (291,'SAN ANTONIO MASAHUAT','07',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (291,'SAN EMIGDIO','08',1),
	 (290,'SAN FRANCISCO CHINAMECA','09',1),
	 (290,'SAN PEDRO MASAHUAT','15',1),
	 (292,'SAN JUAN NONUALCO','10',1),
	 (290,'SAN JUAN TALPA','11',1),
	 (291,'SAN JUAN TEPEZONTES','12',1),
	 (291,'SAN LUIS LA HERRADURA','22',1),
	 (290,'SAN LUIS TALPA','13',1),
	 (291,'SAN MIGUEL TEPEZONTES','14',1),
	 (291,'SAN PEDRO NONUALCO','16',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (292,'SAN RAFAEL OBRAJUELO','17',1),
	 (291,'SANTA MARIA OSTUMA','18',1),
	 (291,'SANTIAGO NONUALCO','19',1),
	 (290,'TAPALHUACA','20',1),
	 (293,'CINQUERA','01',1),
	 (294,'DOLORES','09',1),
	 (294,'GUACOTECTI','02',1),
	 (293,'ILOBASCO','03',1),
	 (293,'JUTIAPA','04',1),
	 (294,'SAN ISIDRO (CABANAS)','05',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (294,'SENSUNTEPEQUE','06',1),
	 (293,'TEJUTEPEQUE','07',1),
	 (294,'VICTORIA','08',1),
	 (295,'APASTEPEQUE','01',1),
	 (296,'GUADALUPE','02',1),
	 (296,'SAN CAYETANO ISTEPEQUE','03',1),
	 (295,'SAN ESTEBAN CATARINA','06',1),
	 (295,'SAN ILDEFONSO','07',1),
	 (295,'SAN LORENZO (SAN VICENTE)','08',1),
	 (295,'SAN SEBASTIAN','09',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (296,'SAN VICENTE','10',1),
	 (295,'SANTA CLARA','04',1),
	 (295,'SANTO DOMINGO','05',1),
	 (296,'TECOLUCA','11',1),
	 (296,'TEPETITAN','12',1),
	 (296,'VERAPAZ','13',1),
	 (297,'ALEGRIA','01',1),
	 (297,'BERLIN','02',1),
	 (298,'CALIFORNIA','03',1),
	 (298,'CONCEPCION BATRES','04',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (297,'EL TRIUNFO','05',1),
	 (298,'EREGUAYQUIN','06',1),
	 (297,'ESTANZUELAS','07',1),
	 (299,'JIQUILISCO','08',1),
	 (297,'JUCUAPA','09',1),
	 (298,'JUCUARAN','10',1),
	 (297,'MERCEDES UMANA','11',1),
	 (297,'NUEVA GRANADA','12',1),
	 (298,'OZATLAN','13',1),
	 (299,'PUERTO EL TRIUNFO','14',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (299,'SAN AGUSTIN','15',1),
	 (297,'SAN BUENAVENTURA','16',1),
	 (298,'SAN DIONISIO','17',1),
	 (299,'SAN FRANCISCO JAVIER','19',1),
	 (298,'SANTA ELENA','18',1),
	 (298,'SANTA MARIA','20',1),
	 (297,'SANTIAGO DE MARIA','21',1),
	 (298,'TECAPAN','22',1),
	 (298,'USULUTAN','23',1),
	 (300,'ARAMBALA','01',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (300,'CACAOPERA','02',1),
	 (301,'CHILANGA','04',1),
	 (300,'CORINTO','03',1),
	 (301,'DELICIAS DE CONCEPCION','05',1),
	 (301,'EL DIVISADERO','06',1),
	 (300,'EL ROSARIO (MORAZAN)','07',1),
	 (301,'GUALOCOCTI','08',1),
	 (301,'GUATAJIAGUA','09',1),
	 (300,'JOATECA','10',1),
	 (300,'JOCOAITIQUE','11',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (301,'JOCORO','12',1),
	 (301,'LOLOTIQUILLO','13',1),
	 (300,'MEANGUERA','14',1),
	 (301,'OSICALA','15',1),
	 (300,'PERQUIN','16',1),
	 (301,'SAN CARLOS','17',1),
	 (300,'SAN FERNANDO (MORAZAN)','18',1),
	 (301,'SAN FRANCISCO GOTERA','19',1),
	 (300,'SAN ISIDRO (MORAZAN)','20',1),
	 (301,'SAN SIMON','21',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (301,'SENSEMBRA','22',1),
	 (301,'SOCIEDAD','23',1),
	 (300,'TOROLA','24',1),
	 (301,'YAMABAL','25',1),
	 (301,'YOLOAIQUIN','26',1),
	 (302,'CAROLINA','01',1),
	 (302,'CHAPELTIQUE','04',1),
	 (304,'CHINAMECA','05',1),
	 (303,'CHIRILAGUA','06',1),
	 (302,'CIUDAD BARRIOS','02',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (303,'COMACARAN','03',1),
	 (304,'EL TRANSITO','07',1),
	 (304,'LOLOTIQUE','08',1),
	 (303,'MONCAGUA','09',1),
	 (304,'NUEVA GUADALUPE','10',1),
	 (302,'NUEVO EDEN DE SAN JUAN','11',1),
	 (303,'QUELEPA','12',1),
	 (302,'SAN ANTONIO DEL MOSCO','13',1),
	 (302,'SAN GERARDO','14',1),
	 (304,'SAN JORGE','15',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (302,'SAN LUIS DE LA REINA','16',1),
	 (303,'SAN MIGUEL','17',1),
	 (304,'SAN RAFAEL ORIENTE','18',1),
	 (302,'SESORI','19',1),
	 (303,'ULUAZAPA','20',1),
	 (306,'LA UNION','08',1),
	 (306,'SAN ALEJO','14',1),
	 (306,'YUCUAIQUIN','18',1),
	 (306,'CONCHAGUA','04',1),
	 (306,'INTIPUCA','07',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (305,'SAN JOSE','15',1),
	 (306,'EL CARMEN (LA UNION)','05',1),
	 (306,'YAYANTIQUE','17',1),
	 (305,'BOLIVAR','02',1),
	 (306,'MEANGUERA DEL GOLFO','10',1),
	 (305,'SANTA ROSA DE LIMA','16',1),
	 (305,'PASAQUINA','12',1),
	 (305,'ANAMOROS','01',1),
	 (305,'NUEVA ESPARTA','11',1),
	 (305,'EL SAUCE','06',1);
INSERT INTO districts (cityId,name,mhCode,isActive) VALUES
	 (305,'CONCEPCION DE ORIENTE','03',1),
	 (305,'POLOROS','13',1),
	 (305,'LISLIQUE','09',1);
  