import Colors from '@constants/Colors'
import Emojis from '@constants/Emojis'
import Reply from '@helpers/Reply'
import Client from '@structures/Client'
import ChatCommand from '@structures/commands/ChatCommand'
import { AccessType, CommandType } from '@structures/commands/Command'
import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, ChatInputCommandInteraction, GuildChannel, channelMention, time } from 'discord.js'
import Moderation from '../../../../structures/moderation/Moderation'

export default class LockCommand extends ChatCommand {
  constructor(client: Client) {
    super(
      client,
      {
        permissions: ['ManageChannels', 'EmbedLinks'],
        access: AccessType.Moderation,
        type: CommandType.Public,
        status: true
      },
      {
        name: 'unlock',
        description: 'Unlock channel',
        options: [
          {
            name: 'channel',
            description: 'Channel to unlock',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: false
          },
          {
            name: 'reason',
            description: 'Reason for unlocking the channel',
            type: ApplicationCommandOptionType.String,
            required: false
          }
        ],
        defaultMemberPermissions: ['ManageChannels'],
        type: ApplicationCommandType.ChatInput,
        dmPermission: false,
      }
    )
  }

  public async execute(client: Client, interaction: ChatInputCommandInteraction<'cached'>) {
    const channel = interaction.options.getChannel('channel') as GuildChannel ?? await client.channels.fetch(interaction.channelId)
    const reason = interaction.options.getString('reason')

    if (!channel) return
    if (channel.type != ChannelType.GuildText) return

    const lockData = client.channelLocks.get(channel.id)

    if (!lockData) {
      Reply.reply({
        client,
        interaction,
        color: Colors.warning,
        author: 'Channel error',
        authorImage: client.user?.avatarURL(),
        description: `${channelMention(channel.id)} is not locked.`,
      })

      return
    }

    else {
      client.channelLocks.delete(channel.id)
    }


    channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: null,
      AttachFiles: null,
      SendMessagesInThreads: null,
      CreatePublicThreads: null,
      CreatePrivateThreads: null,
      AddReactions: null,
    })

    Reply.reply({
      client,
      interaction,
      color: Colors.success,
      author: 'Channel unlock',
      authorImage: client.user?.avatarURL(),
      description: `${channelMention(channel.id)} has been successfully unlocked`,
    })

    const modData = await Moderation.cache(client, interaction.guildId)

    if (modData.webhook) {
      const webhook = await Moderation.getWebhook(client, modData.webhook)

      if (webhook) {
        const description = `${Emojis.channel} Channel: ${channelMention(channel.id)}\n` +
          `${Emojis.user} Moderator: ${interaction.user.username} \`${interaction.user.id}\`\n` +
          `${reason ? `${Emojis.document} Reason: ${reason}\n` : ''}` +
          `${Emojis.unlock} Unlocked at: ${time(new Date(), 'd')} (${time(new Date(), 'R')})`

        try {
          Reply.sendWebhook({
            client,
            webhook,
            description,
            author: 'Channel unlock',
            color: Colors.logsGuild
          })
        } catch (error) {
          console.log(error)
        }
      }
    }
  }
}