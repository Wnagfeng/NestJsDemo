import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryBuilder, Repository } from 'typeorm';
import { User } from './user.entity';
import { Logs } from '../logs/logs.entity';
import { QueryType } from './dto/quey.type';
import { el } from 'element-plus/es/locale';
import { conditionUtils } from 'utils/db.helper';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Logs) private readonly logsRepository: Repository<Logs>,
  ) {}
  findAll(querydata: QueryType) {
    const { username, gender, role, page, limit } = querydata;
    // querydata->{ page: '1', limit: '5', role: '2', gender: '1' }
    // 要求：分页查询一次查询5条用户数据  要求roleid等于2 性别等于Male,不要返回密码
    // 1.typeorm的查询语法
    // return this.userRepository.find({
    //   select: {
    //     id: true,
    //     username: true,
    //   },
    //   relations: {
    //     profile: true,
    //     roles: true,
    //     logs: true,
    //     // password: false,
    //     // username: true,
    //     // id: true,
    //   },
    //   take: parseInt(querydata.limit),
    //   skip: (parseInt(querydata.page) - 1) * parseInt(querydata.limit),
    //   where: {
    //     roles: { id: parseInt(querydata.role) },
    //     profile: { gender: querydata.gender },
    //   },
    // });
    // 2.queryBuilder的查询语法
    // 2.1.1版本查询语法
    // const QueryBuilder = this.userRepository.createQueryBuilder('user');
    // QueryBuilder.innerJoinAndSelect('user.profile', 'profile')
    //   .innerJoinAndSelect('user.roles', 'roles')
    //   .innerJoinAndSelect('user.logs', 'logs');
    // if (username) {
    //   QueryBuilder.where('user.username=:username', { username });
    // } else {
    //   QueryBuilder.where('user.username IS NOT NULL');
    // }
    // if (gender) {
    //   QueryBuilder.andWhere('profile.gender=:gender', { gender });
    // } else {
    //   QueryBuilder.andWhere('profile.gender IS NOT NULL');
    // }
    // if (role) {
    //   QueryBuilder.andWhere('roles.id=:role', { role });
    // } else {
    //   QueryBuilder.andWhere('roles.id IS NOT NULL');
    // }
    // QueryBuilder.take(parseInt(limit));
    // QueryBuilder.skip((parseInt(page) - 1) * parseInt(limit));
    // return QueryBuilder.getMany();

    // 2.1.2版本查询语法
    // const QueryBuilder = this.userRepository.createQueryBuilder('user');
    // QueryBuilder.innerJoinAndSelect('user.profile', 'profile')
    //   .innerJoinAndSelect('user.roles', 'roles')
    //   .innerJoinAndSelect('user.logs', 'logs');
    // QueryBuilder.andWhere(
    //   username ? 'user.username=:username' : 'user.username IS NOT NULL',
    //   { username },
    // );
    // // 这种1=1的写法是为了防止username为null时，where条件为空，导致查询出错
    // // 他和上面的查询语法是一样的
    // // QueryBuilder.andWhere(username ? 'user.username=:username' : '1=1', {
    // //   username,
    // // });
    // QueryBuilder.andWhere(
    //   gender ? 'profile.gender=:gender' : 'profile.gender IS NOT NULL',
    //   { gender },
    // );
    // QueryBuilder.andWhere(role ? 'roles.id=:role' : 'roles.id IS NOT NULL', {
    //   role,
    // });
    // QueryBuilder.take(parseInt(limit));
    // QueryBuilder.skip((parseInt(page) - 1) * parseInt(limit));
    // return QueryBuilder.getMany();
    // 2.1.3版本查询语法
    const QueryBuilder = this.userRepository.createQueryBuilder('user');
    QueryBuilder.innerJoinAndSelect('user.profile', 'profile')
      .innerJoinAndSelect('user.roles', 'roles')
      .innerJoinAndSelect('user.logs', 'logs');
    const queryobj = {
      'user.username': username,
      'profile.gender': gender,
      'roles.id': role,
    };
    const newqueyBulider = conditionUtils<User>(queryobj, QueryBuilder);
    newqueyBulider.take(parseInt(limit));
    newqueyBulider.skip((parseInt(page) - 1) * parseInt(limit));
    return newqueyBulider.getMany();
  }

  find(username: string) {
    return this.userRepository.findOne({ where: { username } });
  }

  findOne(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }

  async create(user: User) {
    const userTmp = await this.userRepository.create(user);
    return this.userRepository.save(userTmp);
  }

  async update(id: number, user: Partial<User>) {
    return this.userRepository.update(id, user);
  }

  remove(id: number) {
    return this.userRepository.delete(id);
  }

  findProfile(id: number) {
    return this.userRepository.findOne({
      where: {
        id,
      },
      relations: {
        profile: true,
      },
    });
  }

  async findUserLogs(id: number) {
    const user = await this.findOne(id);
    return this.logsRepository.find({
      where: {
        user,
      },
      // relations: {
      //   user: true,
      // },
    });
  }

  findLogsByGroup(id: number) {
    // SELECT logs.result as rest, COUNT(logs.result) as count from logs, user WHERE user.id = logs.userId AND user.id = 2 GROUP BY logs.result;
    // return this.logsRepository.query(
    //   'SELECT logs.result as rest, COUNT(logs.result) as count from logs, user WHERE user.id = logs.userId AND user.id = 2 GROUP BY logs.result',
    // );
    return (
      this.logsRepository
        .createQueryBuilder('logs')
        .select('logs.result', 'result')
        .addSelect('COUNT("logs.result")', 'count')
        .leftJoinAndSelect('logs.user', 'user')
        .where('user.id = :id', { id })
        .groupBy('logs.result')
        .orderBy('count', 'DESC')
        .addOrderBy('result', 'DESC')
        .offset(2)
        .limit(3)
        // .orderBy('result', 'DESC')
        .getRawMany()
    );
  }
}
