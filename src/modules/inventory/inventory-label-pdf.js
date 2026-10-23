import bwipjs from 'bwip-js';
import pdfmake from 'pdfmake';
import robotoVirtualFiles from 'pdfmake/build/vfs_fonts.js';

for (const [filename, contents] of Object.entries(robotoVirtualFiles))
  pdfmake.virtualfs.writeFileSync(filename, contents, 'base64');
pdfmake.setUrlAccessPolicy(() => false);
pdfmake.setLocalAccessPolicy(() => false);
pdfmake.addFonts({ Roboto: {
  normal: 'Roboto-Regular.ttf', bold: 'Roboto-Medium.ttf',
  italics: 'Roboto-Italic.ttf', bolditalics: 'Roboto-MediumItalic.ttf',
} });

export async function createInventoryLabelsPdf(lot, count) {
  const barcode = await bwipjs.toBuffer({
    bcid: 'code128', text: lot.product.internalCode,
    scale: 3, height: 12, includetext: true, textxalign: 'center',
  });
  const received = new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium' })
    .format(new Date(lot.receivedAt));
  const labels = Array.from({ length: count }, (_, index) => ({
    stack: [
      { text: lot.product.name, bold: true, fontSize: 10, alignment: 'center', margin: [0, 0, 0, 4] },
      { image: `data:image/png;base64,${barcode.toString('base64')}`, width: 180, alignment: 'center' },
      { text: `Lote: ${lot.code}`, fontSize: 9, alignment: 'center', margin: [0, 4, 0, 0] },
      { text: `Recepción: ${received}`, fontSize: 8, alignment: 'center' },
    ],
    margin: [8, 8, 8, 8],
    pageBreak: index < count - 1 ? 'after' : undefined,
  }));
  return pdfmake.createPdf({
    pageSize: { width: 226.77, height: 141.73 },
    pageMargins: [8, 8, 8, 8], content: labels,
    defaultStyle: { font: 'Roboto' },
    info: { title: `Etiquetas ${lot.code}` },
  }).getBuffer();
}
