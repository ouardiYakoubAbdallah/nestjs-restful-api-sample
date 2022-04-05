import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import * as pactum from 'pactum';
import { AuthDto } from '../src/auth/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let db: PrismaService;

  beforeAll(async () => {
    jest.setTimeout(100000);
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(5000);

    db = app.get(PrismaService);
    await db.truncateAllTables();

    pactum.request.setBaseUrl('http://localhost:5000');
  });

  afterAll(() => app.close());

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'new_user@gmail.com',
      password: '123',
    };
    describe('Signup', () => {
      it('should throw an validation error if email is missing', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });
      it('should throw an validation error if password is missing', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });
      it('should throw an validation error if no data sent (empty body)', () => {
        return pactum.spec().post('/auth/signup').expectStatus(400);
      });
      it('should signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });
    describe('Login', () => {
      it('should throw an validation error if email is missing', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });
      it('should throw an validation error if password is missing', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });
      it('should throw an validation error if no data sent (empty body)', () => {
        return pactum.spec().post('/auth/login').expectStatus(400);
      });
      it('should login', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody(dto)
          .expectStatus(200)
          .stores('userToken', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get current user (Get me)', () => {
      it('should throw an UNAUTHORIZED error when no JWT token is included', () => {
        return pactum.spec().get('/users/me').expectStatus(401).inspect();
      });
      it('should get current logged in user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userToken}',
          })
          .expectStatus(200)
          .inspect();
      });
    });
    describe('Edit user', () => {
      it.todo('should edit user');
    });
  });

  describe('Bookmark', () => {
    describe('Create bookmark', () => {
      it.todo('should create');
    });
    describe('Get all bookmarks', () => {
      it.todo('should get all');
    });
    describe('Get bookmark by id', () => {
      it.todo('should get one by id');
    });
    describe('Edit bookmark', () => {
      it.todo('should update');
    });
    describe('Delete bookmark', () => {
      it.todo('should destroy');
    });
  });
});
