export const BASE_URL = 'https://hwrical.zrgr.pw/';

export const COURSES_URL = () => BASE_URL + '/courses';
export const SCHEDULE_URL = (study: string, course: Course) =>
	BASE_URL + `/${study}/${course.year_part}/${course.course_part}`;

export interface Course {
	course_part: string;
	display_name: string;
	year_part: string;
}

export interface CourseResponse {
	courses: Record<string, Course[]>;
}

export interface Lesson {
	start: Date,
	end: Date,
	location: string,
	title: string,
	description: string,
}