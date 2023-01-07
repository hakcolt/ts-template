import { User } from "../../../../../domain/user/User"
import { IUserRepository } from "../../providerContracts/IUser.repository"
import { BaseUseCase } from "../../../../shared/useCases/BaseUseCase"
import { IUserDTO, UserDTO } from "../../dto/User.dto"
import { Result } from "../../../../shared/useCases/BaseUseCase"
import { IAuthProvider } from "../../providerContracts/IAuth.provider"
import { LocaleType, strings } from "../../../../shared/locals"
import { IUser } from "../../../../../domain/user/IUser"

export class RegisterUserUseCase extends BaseUseCase {
  constructor(
    private readonly repository: IUserRepository,
    private readonly authProvider: IAuthProvider
  ) {
    super()
   }

  override async execute(locale: LocaleType, data: any): Promise<Result> {
    this.setLanguage(locale)
    
    const result = new Result()
    const userDTO: UserDTO = UserDTO.fromJSON(data as IUserDTO)

    if (!userDTO.validate(result, this.resources)) return result

    const hasUser = await this.repository.fetchBy({ email: userDTO.email })

    if (hasUser) {
      result.setError(this.resources.get(strings.USER_ALREADY_EXISTS), 409)
      return result
    }
    const userData = userDTO.toDomain()
    userData.password = this.authProvider.encryptPassword(userData.password)

    await this.createUser(result, userData)

    return result
  }

  async createUser(result: Result, data: IUser) {
    const user = await this.repository.create(data)

    if (user) {
      result.setMessage(this.resources.get(strings.USER_CREATED), 201)
    } else result.setError(this.resources.get(strings.USER_ALREADY_EXISTS), 409)
  }
}