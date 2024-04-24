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
    ORDER_TYPES = ['sub', 'item', 'class'],
    ORDER_ITEMS = { class: 'class', sub: 'sub' },
    PAYSTACK_API_URL = 'https://api.paystack.co',
    TEMPLATE_FILE_PATH = 'downloads/templates',
    AWS_S3_REGION = 'us-east-1',
    LMS_BUCKET_NAME = 'lms.raw-files',
    DEV_LMS_BUCKET_NAME = 'lms-vids',
    TERMS = {
        first_term:{
            title: 'first term',
            courses: [],
            start_date: new Date(),
            end_date: new Date(),
        },
        second_term:{
            title: 'second term',
            courses: [],
            start_date: new Date('2024-03-21T18:18:51.038Z'),
            end_date: new Date('2024-06-21T18:18:51.038Z'),
        },
        third_term:{
            title: 'third term',
            courses: [],
            start_date: new Date(),
            end_date: new Date(),
        }
    };