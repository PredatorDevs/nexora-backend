CREATE TABLE `measurementunits` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(64) NOT NULL,
  `symbol` varchar(32) DEFAULT NULL,
  `mhCode` varchar(3) NOT NULL,
  `comments` varchar(1024) DEFAULT NULL,
  `pluralName` varchar(64) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

INSERT INTO measurementunits (name,symbol,mhCode,comments,pluralName,isActive,createdAt,updatedAt) VALUES
	 ('METRO',NULL,'1','Se mantiene unidad de medida','METROS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('YARDA',NULL,'2','1 yd = 91.4 cm. Unidad de medida que se utilizará según el Reglamento Técnico Salvadoreño RTS. 01.02.01:18 Metrología (SI).','YARDAS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('VARA',NULL,'',NULL,'VARAS',0,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('PIE',NULL,'',NULL,'PIES',0,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('PULGADA',NULL,'',NULL,'PULGADAS',0,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('MILIMETRO',NULL,'6','Se mantiene unidad de medida','MILIMETROS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('MILLA CUADRADA',NULL,'',NULL,'MILLAS CUADRADAS',0,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('KILOMETRO CUADRADO',NULL,'9','Se mantiene unidad de medida','KILOMETROS CUADRADOS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('HECTAREA',NULL,'10','1 ha = 10 000 m2
1 ha = 100 áreas
1 área = 100 m^2','HECTAREAS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('MANZANA',NULL,'',NULL,'MANZANAS',0,'2024-03-26 19:47:00','2024-03-26 19:47:00');
INSERT INTO measurementunits (name,symbol,mhCode,comments,pluralName,isActive,createdAt,updatedAt) VALUES
	 ('ACRE',NULL,'',NULL,'ACRES',0,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('METRO CUADRADO',NULL,'13','Se mantiene unidad de medida','METROS CUADRADOS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('YARDA CUADRADA',NULL,'',NULL,'YARDAS CUADRADAS',0,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('VARA CUADRADA',NULL,'15','Unidad de medida dejará de utilizarse con la entrada en vigencia del Reglamento Técnico Salvadoreño RTS. 01.02.01:18 Metrología (SI).','VARAS CUADRADAS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('PIE CUADRADO',NULL,'',NULL,'PIES CUADRADOS',0,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('PULGADA CUADRADA',NULL,'',NULL,'PULGADAS CUADRADAS',0,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('METRO CUBICO',NULL,'18','1 m^3 = 1000 L','METROS CUBICOS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('YARDA CUBICA',NULL,'',NULL,'YARDAS CUBICAS',0,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('BARRIL',NULL,'20','1 barril = 42 galones (USA)
Aplica solo para productos derivados del petróleo','BARRILES',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('PIE CUBICO',NULL,'',NULL,'PIES CUBICOS',0,'2024-03-26 19:47:00','2024-03-26 19:47:00');
INSERT INTO measurementunits (name,symbol,mhCode,comments,pluralName,isActive,createdAt,updatedAt) VALUES
	 ('GALON',NULL,'22','Un Galón (USA) = 3.785412 L
Unidad de medida que se utilizará según el Regalmento Técnico Salvadoreño RTS 01.02.01:18 Metrología (SI).','GALONES',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('LITRO','L','23','Se mantiene unidad de medida','LITROS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('BOTELLA',NULL,'24','1 L = 1000 mL
1 botella = 750 mL
Unidad botella utilizada para contener generalmente bebidas alcohólicas','BOTELLAS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('PULGADA CUBICA',NULL,'',NULL,'PULGADAS CUBICAS',0,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('MILILITRO','mL','26','Se mantiene unidad de medida','MILILITROS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('ONZA FLUIDA',NULL,'',NULL,'ONZAS FLUIDAS',0,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('TONELADA METRICA',NULL,'',NULL,'TONELADAS METRICAS',0,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('TONELADA',NULL,'30','1 t = 1000 kg','TONELADAS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('QUINTAL METRICO',NULL,'',NULL,'QUINTALES METRICOS',0,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('QUINTAL',NULL,'32','1 qq = 45.35924 kg
Unidad de medida que se utilizará según el Reglamento Técnico Salvadoreño RTS 01.02.01:18 Metrología (SI).','QUINTALES',1,'2024-03-26 19:47:00','2024-03-26 19:47:00');
INSERT INTO measurementunits (name,symbol,mhCode,comments,pluralName,isActive,createdAt,updatedAt) VALUES
	 ('ARROBA',NULL,'33','1 @ = 11.33981 kg
Unidad de medida que se utilizará según el Reglamento Técnico Salvadoreño RTS 01.02.01:18 Metrología (SI).','ARROBAS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('KILOGRAMO',NULL,'34','Se mantiene unidad de medida','KILOGRAMOS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('LIBRA TROY',NULL,'',NULL,'LIBRAS TROY',0,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('LIBRA',NULL,'36','1kg = 2.204622476 lb
1 lb = 453.5924 g

Unidad de medida que se utilizará según el Reglamento Técnico Salvadoreño RTS 01.02.01:18 Metrología (SI).','LIBRAS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('ONZA TROY',NULL,'37','Medida aplica solo para tipo de bien oro.
1 oz troy = 31.103448 g','ONZAS TROY',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('ONZA',NULL,'38','1 oz = 28.34952 g
Unidad de medida que se utilizará según el Reglamento Técnico Salvadoreño RTS 01.02.01:18 Metrología (SI).','ONZAS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('GRAMO','g','39','Se mantiene unidad de medida. 1 kg = 1000 g','GRAMOS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('MILIGRAMO','mg','40','1 g = 1000 mg','MILIGRAMOS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('MEGAWATT',NULL,'42','Se mantiene unidad de medida','MEGAWATTS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('KILOWATT',NULL,'43','Se mantiene unidad de medida','KILOWATTS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00');
INSERT INTO measurementunits (name,symbol,mhCode,comments,pluralName,isActive,createdAt,updatedAt) VALUES
	 ('WATT',NULL,'44','Se mantiene unidad de medida','WATTS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('MEGAVOLTIO-AMPERIO',NULL,'45','Se mantiene unidad de medida','MEGAVOLTIOS-AMPERIOS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('KILOVOLTIO-AMPERIO',NULL,'46','Se mantiene unidad de medida','KILOVOLTIOS-AMPERIOS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('VOLTIO-AMPERIO',NULL,'47','Se mantiene unidad de medida','VOLTIOS-AMPERIOS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('GIGAWATT-HORA',NULL,'49','Se mantiene unidad de medida','GIGAWATTS-HORA',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('MEGAWATT-HORA',NULL,'50','Se mantiene unidad de medida','MEGAWATTS-HORA',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('KILOWATT-HORA',NULL,'51','Se mantiene unidad de medida','KILOWATTS-HORA',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('WATT-HORA',NULL,'52','Se mantiene unidad de medida','WATTS-HORA',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('KILOVOLTIO',NULL,'53','Se mantiene unidad de medida','KILOVOLTIOS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('VOLTIO',NULL,'54','Se mantiene unidad de medida','VOLTIOS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00');
INSERT INTO measurementunits (name,symbol,mhCode,comments,pluralName,isActive,createdAt,updatedAt) VALUES
	 ('MILLAR',NULL,'55','Millar = 1000 unidades
Utilizada para detallar formas de presentación del producto.','MILLARES',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('MEDIO MILLAR',NULL,'56','Medio millar = 500 unidades
Utilizada para detallar formas de presentación del producto.','MEDIOS MILLARES',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('CIENTO',NULL,'57','Ciento = 100 unidades
Utilizada para detallar formas de presentación del producto.','CIENTOS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('DOCENA',NULL,'58','Docena = 12 unidades
Utilizada para detallar formas de presentación del producto.','DOCENAS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('UNIDAD','U','59','Unidad = 1 unidad
Utilizada para detallar formas de presentación del producto.','UNIDADES',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('OTRA',NULL,'99',NULL,'OTRAS',1,'2024-03-26 19:47:00','2024-03-26 19:47:00'),
	 ('CÉLULA POR MICROLITRO','células/µL','N/A','Unidad clínica; no corresponde al catálogo fiscal del Ministerio de Hacienda.','CÉLULAS POR MICROLITRO',1,'2026-08-05 21:35:56','2026-08-05 21:35:56'),
	 ('FEMTOLITRO','fL','N/A','Unidad clínica; no corresponde al catálogo fiscal del Ministerio de Hacienda.','FEMTOLITROS',1,'2026-08-05 21:35:56','2026-08-05 21:35:56'),
	 ('GRAMO POR DECILITRO','g/dL','N/A','Unidad clínica; no corresponde al catálogo fiscal del Ministerio de Hacienda.','GRAMOS POR DECILITRO',1,'2026-08-05 21:35:56','2026-08-05 21:35:56'),
	 ('MICROGRAMO POR DECILITRO','µg/dL','N/A','Unidad clínica; no corresponde al catálogo fiscal del Ministerio de Hacienda.','MICROGRAMOS POR DECILITRO',1,'2026-08-05 21:35:56','2026-08-05 21:35:56');
INSERT INTO measurementunits (name,symbol,mhCode,comments,pluralName,isActive,createdAt,updatedAt) VALUES
	 ('MICROMOL POR LITRO','µmol/L','N/A','Unidad clínica; no corresponde al catálogo fiscal del Ministerio de Hacienda.','MICROMOLES POR LITRO',1,'2026-08-05 21:35:56','2026-08-05 21:35:56'),
	 ('MIL POR MICROLITRO','10^3/µL','N/A','Unidad clínica; no corresponde al catálogo fiscal del Ministerio de Hacienda.','MILES POR MICROLITRO',1,'2026-08-05 21:35:56','2026-08-05 21:35:56'),
	 ('MILIEQUIVALENTE POR LITRO','mEq/L','N/A','Unidad clínica; no corresponde al catálogo fiscal del Ministerio de Hacienda.','MILIEQUIVALENTES POR LITRO',1,'2026-08-05 21:35:56','2026-08-05 21:35:56'),
	 ('MILIGRAMO POR DECILITRO','mg/dL','N/A','Unidad clínica; no corresponde al catálogo fiscal del Ministerio de Hacienda.','MILIGRAMOS POR DECILITRO',1,'2026-08-05 21:35:56','2026-08-05 21:35:56'),
	 ('MILÍMETRO POR HORA','mm/h','N/A','Unidad clínica; no corresponde al catálogo fiscal del Ministerio de Hacienda.','MILÍMETROS POR HORA',1,'2026-08-05 21:35:56','2026-08-05 21:35:56'),
	 ('MILIMOL POR LITRO','mmol/L','N/A','Unidad clínica; no corresponde al catálogo fiscal del Ministerio de Hacienda.','MILIMOLES POR LITRO',1,'2026-08-05 21:35:56','2026-08-05 21:35:56'),
	 ('MILIUNIDAD INTERNACIONAL POR LITRO','mUI/L','N/A','Unidad clínica; no corresponde al catálogo fiscal del Ministerio de Hacienda.','MILIUNIDADES INTERNACIONALES POR LITRO',1,'2026-08-05 21:35:56','2026-08-05 21:35:56'),
	 ('MILLÓN POR MICROLITRO','10^6/µL','N/A','Unidad clínica; no corresponde al catálogo fiscal del Ministerio de Hacienda.','MILLONES POR MICROLITRO',1,'2026-08-05 21:35:56','2026-08-05 21:35:56'),
	 ('NANOGRAMO POR MILILITRO','ng/mL','N/A','Unidad clínica; no corresponde al catálogo fiscal del Ministerio de Hacienda.','NANOGRAMOS POR MILILITRO',1,'2026-08-05 21:35:56','2026-08-05 21:35:56'),
	 ('PICOGRAMO','pg','N/A','Unidad clínica; no corresponde al catálogo fiscal del Ministerio de Hacienda.','PICOGRAMOS',1,'2026-08-05 21:35:56','2026-08-05 21:35:56');
INSERT INTO measurementunits (name,symbol,mhCode,comments,pluralName,isActive,createdAt,updatedAt) VALUES
	 ('PORCENTAJE','%','N/A','Unidad clínica; no corresponde al catálogo fiscal del Ministerio de Hacienda.','PORCENTAJES',1,'2026-08-05 21:35:56','2026-08-05 21:35:56'),
	 ('RAZÓN NORMALIZADA INTERNACIONAL','INR','N/A','Unidad clínica; no corresponde al catálogo fiscal del Ministerio de Hacienda.',NULL,1,'2026-08-05 21:35:56','2026-08-05 21:35:56'),
	 ('SEGUNDO','s','N/A','Unidad clínica; no corresponde al catálogo fiscal del Ministerio de Hacienda.','SEGUNDOS',1,'2026-08-05 21:35:56','2026-08-05 21:35:56'),
	 ('UNIDAD INTERNACIONAL POR LITRO','UI/L','N/A','Unidad clínica; no corresponde al catálogo fiscal del Ministerio de Hacienda.','UNIDADES INTERNACIONALES POR LITRO',1,'2026-08-05 21:35:56','2026-08-05 21:35:56'),
	 ('UNIDAD POR LITRO','U/L','N/A','Unidad clínica; no corresponde al catálogo fiscal del Ministerio de Hacienda.','UNIDADES POR LITRO',1,'2026-08-05 21:35:56','2026-08-05 21:35:56');
