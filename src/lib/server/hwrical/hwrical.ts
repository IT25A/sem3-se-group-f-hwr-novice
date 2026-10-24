export const BASE_URL = 'https://hwrical.zrgr.pw/';

export const COURSES_URL = () => BASE_URL + '/courses';

export interface Course {
	course_part: string;
	display_name: string;
	year_part: string;
}

export interface CourseResponse {
	courses: Record<string, Course[]>;
}