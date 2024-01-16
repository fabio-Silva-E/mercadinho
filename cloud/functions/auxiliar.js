

Parse.Cloud.define("hello",(request) =>{
    return "Hello world mercadinho"
});







/* const PDF = Parse.Object.extend("PDF"); // Substitua "PDF" pelo nome da sua classe para armazenar PDFs no Back4App.

Parse.Cloud.define('upload-pdf', async (req) => {
  if (!req.params.pdfData) throw 'INVALID-PDF-DATA';

  const pdfFile = new Parse.File("arquivo.pdf",   req.params.pdfData );

  const pdf = new PDF();
  pdf.set("pdfFile", pdfFile);

  try {
    await pdf.save(null, { useMasterKey: true });
    return "PDF salvo com sucesso!";
  } catch (error) {
    throw `Erro ao salvar o PDF: ${error.message}`;
  }
});
/*const PDF = Parse.Object.extend("PDF"); // Substitua "PDFPath" pelo nome da sua classe para armazenar os caminhos dos PDFs no Back4App.

Parse.Cloud.define('upload-pdf', async (req) => {
  if (!req.params.pdfPath) throw 'INVALID-PDF-PATH';

  const pdfPath = new PDFPath();
  pdfPath.set("path", req.params.pdfPath);

  try {
    await pdfPath.save(null, { useMasterKey: true });
    return "Caminho do PDF salvo com sucesso!";
  } catch (error) {
    throw `Erro ao salvar o caminho do PDF: ${error.message}`;
  }
});*/

