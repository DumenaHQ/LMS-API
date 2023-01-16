export const
    USER_TYPES = {
        user: 'user',
        parent: 'parent',
        school: 'school',
        learner: 'learner',
        admin: 'admin'
    },
    USER_FIELDS = 'fullname email username role isUserOnboarded active_organization createdAt updatedAt',
    LEARNER_FIELDS = 'parent school interests avatar resident_state',
    SALT_ROUNDS = 10,
    UPLOADS = {
        course_thumbs: 'course_thumbs',
        lesson_videos: 'lessons'
    },
    DIFFICULTY_LEVEL = ['Beginner', 'Intermediate', 'Advanced'],
    COURSE_QUADRANT = ['Developer', 'Designer', 'Innovator', 'Maker'],
    ORDER_TYPES = ['sub', 'item'],
    PAYSTACK_API_URL = 'https://api.paystack.co',
    TEMPLATE_FILE_PATH = 'downloads/templates'
