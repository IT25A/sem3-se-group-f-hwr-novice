// Modules of the 3rd semester of the IT study program at HWR Berlin.

export type CatalogModule = {
	code: string;
	name: string;
	lp: number;
	presence_le: number;
	exam_le: number;
	self_study_le: number;
};

// prettier-ignore
export const CATALOGS: Record<string, CatalogModule[]> = {
	'informatik/2024/5': [
		{ code: 'IT4171', name: 'Projektmanagement', lp: 7, presence_le: 77, exam_le: 0, self_study_le: 73 },
		{ code: 'IT2211', name: 'Betriebssysteme', lp: 7, presence_le: 77, exam_le: 3, self_study_le: 70 },
		{ code: 'IT3181', name: 'Grafik/Multimedia', lp: 7, presence_le: 77, exam_le: 3, self_study_le: 70 },
		{ code: 'IT3191', name: 'Künstliche Intelligenz', lp: 7, presence_le: 77, exam_le: 3, self_study_le: 70 },
		{ code: 'IT3201', name: 'Studienprojekt II', lp: 14, presence_le: 99, exam_le: 0, self_study_le: 51 }
	],
	'informatik/2025/3': [
		{ code: 'IT1111', name: 'Data Science', lp: 6, presence_le: 66, exam_le: 3, self_study_le: 61 },
		{ code: 'IT2091', name: 'Embedded Systems', lp: 5, presence_le: 55, exam_le: 2, self_study_le: 53 },
		{ code: 'IT2121', name: 'Webprogrammierung', lp: 5, presence_le: 66, exam_le: 0, self_study_le: 44 },
		{ code: 'IT2101', name: 'Software-Engineering', lp: 7, presence_le: 77, exam_le: 0, self_study_le: 84 },
		{ code: 'IT2111', name: 'Verteilte Systeme', lp: 4, presence_le: 33, exam_le: 0, self_study_le: 57 },
		{ code: 'IT2321', name: 'Praxistransfer III', lp: 7, presence_le: 33, exam_le: 0, self_study_le: 0 }
	],
	'informatik/2026/1': [
		{ code: 'IT1011', name: 'Algebra und lineare Algebra', lp: 7, presence_le: 77, exam_le: 2, self_study_le: 71 },
		{ code: 'IT2031', name: 'Grundlagen der Informatik', lp: 6, presence_le: 66, exam_le: 3, self_study_le: 51 },
		{ code: 'IT2041', name: 'Grundlagen der Programmierung', lp: 5, presence_le: 66, exam_le: 0, self_study_le: 44 },
		{ code: 'IT2051', name: 'Spezielle Programmiersprachen', lp: 3, presence_le: 33, exam_le: 3, self_study_le: 24 },
		{ code: 'IT4021', name: 'Methodenkompetenzen: Wissenschaftliches Arbeiten', lp: 6, presence_le: 77, exam_le: 0, self_study_le: 73 },
		{ code: 'IT2301', name: 'Praxistransfer I', lp: 7, presence_le: 33, exam_le: 0, self_study_le: 0 }
	]
};

export function catalogFor(study: string, cohort: number, semester: number) {
	return CATALOGS[`${study}/${cohort}/${semester}`] ?? [];
}

/** Total ECTS of the whole study programme, the target of the overall progress bar. */
export const TOTAL_ECTS = 210;

/** ECTS of one semester of the study programme. */
export const ECTS_PER_SEMESTER = 35;
