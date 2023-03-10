import Colors from '@constants/Colors'
import Options from '@constants/Options'
import Reply from '@helpers/Reply'
import Client from '@structures/Client'
import ChatCommand from '@structures/commands/ChatCommand'
import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord-api-types/v10'
import { ActivityType, ChatInputCommandInteraction } from 'discord.js'

export default class MaintenanceCommand extends ChatCommand {
  constructor(client: Client) {
    super(
      client,
      {
        permissions: [],
        access: 'private',
        type: 'private',
        status: true
      },
      {
        name: 'maintenance',
        description: 'Maintenance mode',
        type: ApplicationCommandType.ChatInput,
        dmPermission: true,
        options: [
          {
            name: 'status',
            description: 'Current status',
            type: ApplicationCommandOptionType.Boolean,
            required: true
          }
        ]
      }
    )
  }

  public async execute(client: Client, interaction: ChatInputCommandInteraction) {
    const status = interaction.options.getBoolean('status', true)

    Options.maintenance = status
    this.changePresence(client, status)

    await Reply.reply({
      client,
      interaction: interaction,
      color: Colors.primary,
      author: 'Maintenance mode',
      description: `${status ? 'Enabling' : 'Disabling'} maintenance mode`
    })
  }

  public changePresence(client: Client, status: boolean) {
    if (status) {
      client.user?.setActivity({
        name: 'Maintenance mode',
        type: ActivityType.Watching
      })

      client.user?.setStatus('idle')
    }

    else {
      client.user?.setActivity({
        name: Options.activity,
        type: ActivityType.Listening
      })

      client.user?.setStatus(Options.status)
    }
  }
}