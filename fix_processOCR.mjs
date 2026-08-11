import fs from 'fs';
const path = 'C:/Users/SP/Downloads/shiv-infra/backend/services/whatsapp/WhatsappWebhookService.ts';
let content = fs.readFileSync(path, 'utf8');

const oldText = `        const result =

            await OCRService.extractInvoiceData(

                normalizedMediaId

            );



        if (!result) {

            console.warn(

                "⚠️ OCR SERVICE RETURNED EMPTY RESULT"

            );

            return null;

        }



        console.log(

            "✅ SHIVINFRA OCR COMPLETED",

            {

                media_id:
                    normalizedMediaId

            }

        );



        return result;`;

const newText = `        let tempFilePath: string | null = null;



        try {



            // =================================================
            // DOWNLOAD MEDIA
            // =================================================



            const mediaBuffer =
            await WhatsAppService.downloadMedia(
                normalizedMediaId
            );



            if (!mediaBuffer) {



                console.warn(
                    "⚠️ MEDIA DOWNLOAD FAILED - USING SIMULATION"
                );



                return this.simulateOCRResult(
                    normalizedMediaId,
                    normalizedType
                );



            }



            // =================================================
            // SAVE TEMP FILE
            // =================================================



            const ext =
            normalizedType === "document"
                ? ".pdf"
                : ".jpg";



            tempFilePath =
            path.join(
                os.tmpdir(),
                \`shivinfra-ocr-\${Date.now()}-\${normalizedMediaId}\${ext}\`
            );



            fs.writeFileSync(
                tempFilePath,
                mediaBuffer
            );



            console.log(
                "📥 MEDIA DOWNLOADED",
                {
                    media_id:
                        normalizedMediaId,
                    temp_path:
                        tempFilePath,
                    size:
                        mediaBuffer.length
                }
            );



            // =================================================
            // RUN OCR
            // =================================================



            const result =
            await OCRService.extractInvoiceData(
                tempFilePath
            );



            if (!result) {



                console.warn(
                    "⚠️ OCR SERVICE RETURNED EMPTY RESULT"
                );



                return null;



            }



            console.log(
                "✅ SHIVINFRA OCR COMPLETED",
                {
                    media_id:
                        normalizedMediaId
                }
            );



            return result;



        }
        catch (error) {



            console.error(
                "❌ OCR PROCESS ERROR",
                this.normalizeError(error)
            );



            return null;



        }
        finally {



            // =================================================
            // CLEANUP TEMP FILE
            // =================================================



            if (
                tempFilePath
                &&
                fs.existsSync(
                    tempFilePath
                )
            ) {



                try {


                    fs.unlinkSync(
                        tempFilePath
                    );


                }
                catch (cleanupError) {



                    console.warn(
                        "⚠️ TEMP FILE CLEANUP FAILED",
                        cleanupError
                    );



                }



            }



        }`;

console.log('Found oldText:', content.includes(oldText));
if (content.includes(oldText)) {
    content = content.replace(oldText, newText);
    fs.writeFileSync(path, content);
    console.log('Replaced processOCR');
} else {
    console.log('Could not find oldText');
}
