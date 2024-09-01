export const
    USER_TYPES = {
        user: 'user',
        parent: 'parent',
        school: 'school',
        learner: 'learner',
        instructor: 'instructor',
        admin: 'admin'
    },
    USER_FIELDS = 'fullname email username role isUserOnboarded active_organization createdAt updatedAt',
    LEARNER_FIELDS = 'parent school interests avatar resident_state',
    SALT_ROUNDS = 10,
    UPLOADS = {
        course_thumbs: 'course_thumbs',
        lesson_videos: 'lessons',
        program_thumbs: 'program_thumbs',
        program_header_photos: 'program_header_photos',
        class_thumbs: 'class_thumbs',
        class_header_photos: 'class_header_photos'
    },
    DIFFICULTY_LEVEL = ['Beginner', 'Intermediate', 'Advanced'],
    COURSE_QUADRANT = ['Developer', 'Designer', 'Innovator', 'Maker'],
    ORDER_TYPES = { class: 'class', class_sub: 'class-sub', program: 'program' },
    // ORDER_ITEMS = { class: 'class', sub: 'sub', program: 'program' },
    PAYSTACK_API_URL = 'https://api.paystack.co',
    TEMPLATE_FILE_PATH = 'downloads/templates',
    AWS_S3_REGION = 'us-east-1',
    LMS_BUCKET_NAME = 'lms-vids',
    DEV_LMS_BUCKET_NAME = 'lms-vids',
    TERMS = {
        first_term: {
            title: 'first term',
            modules: [],
            defaultDateChanged: false,
            start_date: new Date(String(`${new Date().getFullYear()}-09-03T00:00:00.000Z`)),
            end_date: new Date(`${new Date().getFullYear()}-12-23T00:00:00.000Z`),
        },
        second_term: {
            title: 'second term',
            modules: [],
            defaultDateChanged: false,
            start_date: new Date(`${new Date().getFullYear()}-01-03T00:00:00.000Z`),
            end_date: new Date(`${new Date().getFullYear()}-04-07T00:00:00.000Z`),
        },
        third_term: {
            title: 'third term',
            modules: [],
            defaultDateChanged: false,
            start_date: new Date(`${new Date().getFullYear()}-04-14T00:00:00.000Z`),
            end_date: new Date(`${new Date().getFullYear()}-07-20T00:00:00.000Z`),
        }
    },
    QUIZ_PASS_MARK = 80;