// Modules of the 3rd semester of the IT study program at HWR Berlin.
export const MODULE_CATALOG = [
	{ code: 'IT1111', name: 'Data Science', lp: 6, presence_le: 66, exam_le: 3, self_study_le: 61 },
	{
		code: 'IT2091',
		name: 'Embedded Systems',
		lp: 5,
		presence_le: 55,
		exam_le: 2,
		self_study_le: 53
	},
	{
		code: 'IT2121',
		name: 'Webprogrammierung',
		lp: 5,
		presence_le: 66,
		exam_le: 0,
		self_study_le: 44
	},
	{
		code: 'IT2101',
		name: 'Software-Engineering',
		lp: 7,
		presence_le: 77,
		exam_le: 0,
		self_study_le: 84
	},
	{
		code: 'IT2111',
		name: 'Verteilte Systeme',
		lp: 4,
		presence_le: 33,
		exam_le: 0,
		self_study_le: 57
	}
];

/** Total ECTS of the whole study programme, the target of the overall progress bar. */
export const TOTAL_ECTS = 210;

/** ECTS of the semesters before the catalog (1st and 2nd semester), assumed to be passed. */
export const EARLIER_ECTS = 70;
