// AUTHENTICATION ACTIVITIES
export enum AuthenticationActivityType {
    'login',
    'logout',
}
export const AuthenticationActivity = {
    type: AuthenticationActivityType,
    timestamp: Date,
    details:{
        ip: String,
        device: String,
    }
};


// CLASSROOM ACTIVITIES
export enum ClassroomActivityType {
    'joined_class',
    'entered_class',
    'exited_class',
}
export const ClassroomActivity = {
    type: ClassroomActivityType,
    classroom:{
        id: String,
        name: String
    },
    timestamp: Date,
    details:{
        ip: String,
        device: String,
    }
};


// LESSON ACTIVITIES
export enum LessonActivityType {
    'started_lesson',
    'paused_lesson',
    'stopped_lesson',
    'completed_lesson',
}
export const LessonActivity = {
    type: LessonActivityType,
    lesson:{
        id: String,
        title: String,
        has_video: Boolean,
        video_url: String || undefined,
        video_timestamp: Number || undefined // At what point in the video, the video was paused, started, stopped, completed. This is in seconds
    },
    timestamp: Date,
    details:{
        ip: String,
        device: String,
    }
};

// QUIZ ACTIVITIES
export enum QuizActivityType {
    'started_quiz',
    'paused_quiz',
    'stopped_quiz',
    'completed_quiz',
}
export const QuizActivity = {
    type: QuizActivityType,
    quiz:{
        id: String,
        title: String
    },
    timestamp: Date,
    details:{
        ip: String,
        device: String,
    }
};

// CLICK ACTIVITIES
export enum ClickActivityType {
    'clicked_link',
}
export const ClickActivity = {
    type: ClickActivityType,
    timestamp: Date,
    url: String,
    details:{
        ip: String,
        device: String,
    }
};