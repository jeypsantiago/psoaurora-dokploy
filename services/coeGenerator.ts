import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { EmploymentRecord } from '../types';

export const generateCOE = async (
    record: EmploymentRecord,
    allRecords: EmploymentRecord[],
    referenceNo = ''
) => {
    try {
        // 1. Fetch the template from the public folder
        const response = await fetch('/coe_template.docx');
        if (!response.ok) {
            throw new Error(`Failed to load template: ${response.statusText}`);
        }

        const templateArrayBuffer = await response.arrayBuffer();

        // 2. Load it into PizZip
        const zip = new PizZip(templateArrayBuffer);

        // 3. Initialize Docxtemplater
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: { start: '{{', end: '}}' }
        });

        // 4. Transform data for the template

        // Find all records belonging to this person to populate the table (case-insensitive)
        const matchingRecords = allRecords.filter(
            (r) => r.name.toLowerCase().trim() === record.name.toLowerCase().trim()
        );

        // Sort by from date (oldest to newest)
        matchingRecords.sort((a, b) => new Date(a.durationFrom).getTime() - new Date(b.durationFrom).getTime());

        // Create the contracts array for the table `{#contracts}` loop
        const contracts = matchingRecords.map((r) => {
            const fromDate = new Date(r.durationFrom).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
            const toDate = new Date(r.durationTo).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });

            return {
                from: fromDate,
                to: toDate,
                project: r.surveyProject,
                designation: r.designation
            };
        });

        const honorific = record.sex === 'Male' ? 'Mr.' : 'Ms.';
        const nameParts = record.name.trim().split(' ');
        const lastName = nameParts[nameParts.length - 1];

        const currentDate = new Date();
        const currentDay = currentDate.getDate();
        const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long' });
        const currentYear = currentDate.getFullYear();

        // Ordinal suffix logic
        const getOrdinalSuffix = (day: number) => {
            if (day >= 11 && day <= 13) return 'th';
            switch (day % 10) {
                case 1: return 'st';
                case 2: return 'nd';
                case 3: return 'rd';
                default: return 'th';
            }
        };
        const currentDaySuffix = getOrdinalSuffix(currentDay);

        // 5. Render the document
        doc.render({
            referenceNo,
            fullName: record.name.toUpperCase(),
            honorific: honorific,
            lastName: lastName,
            currentDay: currentDay,
            currentDaySuffix: currentDaySuffix,
            currentMonth: currentMonth,
            currentYear: currentYear,
            contracts: contracts,
            focalPerson: record.focalPerson.toUpperCase()
        });

        // 6. Generate and Download
        const out = doc.getZip().generate({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        const fileName = `COE_${record.serialNumber}_${record.name.replace(/\s+/g, '_')}.docx`;
        const url = URL.createObjectURL(out);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);

        return true;

    } catch (error: any) {
        let errorMsg = 'Unknown error';
        if (error.properties && error.properties.errors instanceof Array) {
            errorMsg = error.properties.errors.map(function (e: any) {
                return e.properties.explanation;
            }).join("\\n");
            console.error('Template errors:', errorMsg);
        }
        console.error('Error generating COE:', error);
        throw new Error(errorMsg || error.message);
    }
};
