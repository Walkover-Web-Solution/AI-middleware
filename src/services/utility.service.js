import csvParser from "csv-parser";
import { Readable } from "stream";

const parseCsv = (csvBuffer) =>
  new Promise(() => {
    // let parsedData = '';
    const csvStream = csvParser();
    // .on('data', (row) => {
    //   parsedData = parsedData + row
    // })
    // .on('end', () => {
    //   console.log('CSV parsing complete');
    //   // console.log('Parsed Data:', parsedData);
    //   resolve(parsedData);
    // })
    // .on('error', (error) => {
    //   console.error('Error parsing CSV:', error.message);
    //   reject(error);
    // });

    const readableStream = new Readable();
    readableStream.push(csvBuffer);
    readableStream.push(null);

    readableStream.pipe(csvStream);
  });
export { parseCsv };
