import { createRequire } from 'node:module';
import { dirname, join, resolve, sep } from 'node:path';
import pdfmake from 'pdfmake';

const require = createRequire(import.meta.url);
const packageDirectory = dirname(require.resolve('pdfmake/package.json'));
const fontDirectory = join(packageDirectory, 'fonts', 'Roboto');
const allowedFontPrefix = `${resolve(fontDirectory)}${sep}`;

pdfmake.setUrlAccessPolicy(() => false);
pdfmake.setLocalAccessPolicy((path) =>
  resolve(path).startsWith(allowedFontPrefix),
);

pdfmake.addFonts({
  Roboto: {
    normal: join(fontDirectory, 'Roboto-Regular.ttf'),
    bold: join(fontDirectory, 'Roboto-Medium.ttf'),
    italics: join(fontDirectory, 'Roboto-Italic.ttf'),
    bolditalics: join(fontDirectory, 'Roboto-MediumItalic.ttf'),
  },
});

const valueOrDash = (value) => value || '—';
const decimal = (value) => Number(value).toLocaleString('es-SV', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

function formatter(company, options) {
  return new Intl.DateTimeFormat(company.locale || 'es-SV', {
    timeZone: company.timezone || 'America/El_Salvador',
    ...options,
  });
}

function address(entity) {
  return [
    entity.addressLine,
    entity.district?.name,
    entity.municipality?.name,
    entity.department?.name,
    entity.foreignLocality,
    entity.foreignAdministrativeArea,
    entity.country?.name,
  ]
    .filter(Boolean)
    .join(', ');
}

export function buildPurchaseRequestDocument(request) {
  const { company } = request;
  const date = formatter(company, { dateStyle: 'medium' });
  const dateTime = formatter(company, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const origins = request.sourceRequests.map((item) => item.code).join(', ');

  return {
    pageSize: 'LETTER',
    pageMargins: [36, 72, 36, 54],
    info: {
      title: `Solicitud de compra ${request.code}`,
      author: company.legalName,
      subject: 'Solicitud de compra aprobada',
      keywords: `solicitud de compra,${request.code}`,
    },
    header: {
      margin: [36, 24, 36, 0],
      columns: [
        {
          stack: [
            { text: company.commercialName, style: 'companyName' },
            { text: company.legalName, style: 'muted' },
            {
              text: `NIT ${company.nit} · NRC ${company.nrc}`,
              style: 'muted',
            },
          ],
        },
        {
          width: 210,
          stack: [
            { text: 'SOLICITUD DE COMPRA', style: 'documentTitle' },
            { text: request.code, style: 'documentCode' },
          ],
        },
      ],
    },
    footer: (currentPage, pageCount) => ({
      margin: [36, 14, 36, 0],
      columns: [
        { text: `Generado el ${dateTime.format(new Date())}`, style: 'footer' },
        {
          text: `Página ${currentPage} de ${pageCount}`,
          alignment: 'right',
          style: 'footer',
        },
      ],
    }),
    content: [
      {
        table: {
          widths: [90, '*', 90, '*'],
          body: [
            ['Estado', 'APROBADA', 'Tipo', 'Consolidada'],
            [
              'Solicitada',
              dateTime.format(request.requestDate),
              'Requerida',
              date.format(request.requiredDate),
            ],
            [
              'Solicitante',
              request.requestedBy.displayName,
              'Aprobada por',
              request.approvedBy?.displayName ?? '—',
            ],
            [
              'Sucursal',
              `${request.branch.code} · ${request.branch.name}`,
              'Almacén',
              `${request.warehouse.code} · ${request.warehouse.name}`,
            ],
          ],
        },
        layout: 'lightHorizontalLines',
      },
      { text: 'Destino', style: 'sectionTitle' },
      { text: valueOrDash(address(request.branch)) },
      {
        columns: [
          { text: `Teléfono: ${valueOrDash(request.branch.phone)}` },
          { text: `Correo: ${valueOrDash(request.branch.email)}` },
        ],
        margin: [0, 4, 0, 0],
      },
      { text: 'Justificación', style: 'sectionTitle' },
      { text: request.justification },
      ...(request.notes
        ? [{ text: 'Observaciones', style: 'sectionTitle' }, { text: request.notes }]
        : []),
      ...(origins
        ? [
            { text: 'Solicitudes de origen', style: 'sectionTitle' },
            { text: origins },
          ]
        : []),
      { text: 'Productos solicitados', style: 'sectionTitle' },
      {
        table: {
          headerRows: 1,
          widths: [24, 82, '*', 62, 80],
          body: [
            [
              { text: '#', style: 'tableHeader' },
              { text: 'Código', style: 'tableHeader' },
              { text: 'Producto', style: 'tableHeader' },
              { text: 'Cantidad', style: 'tableHeader', alignment: 'right' },
              { text: 'Unidad', style: 'tableHeader' },
            ],
            ...request.details.map((detail) => [
              String(detail.lineNumber),
              detail.product.internalCode,
              [detail.product.name, detail.description]
                .filter(Boolean)
                .join('\n'),
              { text: decimal(detail.quantity), alignment: 'right' },
              detail.productUnit.name,
            ]),
          ],
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? '#E8EEF7' : null),
          hLineColor: '#C7CED8',
          vLineColor: '#C7CED8',
        },
      },
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: '\n\n________________________________' },
              { text: request.requestedBy.displayName, alignment: 'center' },
              { text: 'Solicitante', alignment: 'center', style: 'muted' },
            ],
          },
          { width: 36, text: '' },
          {
            width: '*',
            stack: [
              { text: '\n\n________________________________' },
              {
                text: request.approvedBy?.displayName ?? 'Responsable',
                alignment: 'center',
              },
              { text: 'Aprobación', alignment: 'center', style: 'muted' },
              {
                text: request.approvedAt
                  ? dateTime.format(request.approvedAt)
                  : '',
                alignment: 'center',
                style: 'muted',
              },
            ],
          },
        ],
        unbreakable: true,
        margin: [0, 20, 0, 0],
      },
    ],
    defaultStyle: { font: 'Roboto', fontSize: 9, color: '#1F2937' },
    styles: {
      companyName: { bold: true, fontSize: 13, color: '#0F3D75' },
      documentTitle: {
        bold: true,
        fontSize: 14,
        alignment: 'right',
        color: '#0F3D75',
      },
      documentCode: { bold: true, fontSize: 11, alignment: 'right' },
      sectionTitle: {
        bold: true,
        fontSize: 10,
        color: '#0F3D75',
        margin: [0, 14, 0, 5],
      },
      tableHeader: { bold: true, color: '#0F3D75' },
      muted: { color: '#6B7280', fontSize: 8 },
      footer: { color: '#6B7280', fontSize: 7 },
    },
  };
}

export async function generatePurchaseRequestPdf(request) {
  return pdfmake.createPdf(buildPurchaseRequestDocument(request)).getBuffer();
}
