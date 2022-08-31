import xlsx from "json-as-xlsx";

export const xlsxHelper = {
    write(columns: [], content: [], filename: string) {
        const settings = {
            fileName: filename,
            extraLength: 3,
            writeOptions: {
                type: "buffer",
                bookType: "xlsx",
            },
        };

        const data = [
            {
                sheet: 'Sheet 1',
                columns,
                content
            }
        ];

        return xlsx(data, settings);
    }
}