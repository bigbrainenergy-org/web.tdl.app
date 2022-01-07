import { User } from '../../components/models'

export interface UsersStateInterface {
  user: User;
}

function state(): UsersStateInterface {
  return {
    user: {
      id: 0,
      username: '',
      locale: 'en',
      time_zone: 'UTC'
    },
  }
};

export default state;
