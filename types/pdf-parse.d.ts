declare module "pdf-parse" {
    interface PDFData {
        text: string;
        numpages: number;
        numrender: number;
        info: Record<string, any>;
        metadata: any;
        version: string;
    }

    function pdfParse(
        dataBuffer: Buffer | ArrayBuffer | Uint8Array,
        options?: Record<string, any>
    ): Promise<PDFData>;

    export = pdfParse;
}
