// init libraries here
const Discord = require("discord.js");
const config = require("./kashimaconfig.json");
const YouTube = require("simple-youtube-api");
const ytdl = require("ytdl-core");
const nekoapi = require('nekos.life');
const DBList = require("dblapi.js");
const osuapi = require("osu").api(config.osukey);
const Enmap = require('enmap');
const EnmapSQLite = require('enmap-sqlite');
const http = require("http");
const express = require('express');
const app = express();

//init stuffs here
const client = new Discord.Client({ disableEveryone: true });
const { Client, Util } = Discord ;
const nekostuff = new nekoapi();
const youtube = new YouTube(config.google_api_key);
const dbl = new DBList(config.dblkashimatoken);
const settings = new Enmap({provider:new EnmapSQLite({name: "settings", dataDir: `./my-folder`})});
const defaultSettings = {
  prefix: config.prefix
}
const queue = new Map();


//
//function to increment the uptime counter
//
var secs = 0;
var mins = 0;
var hours = 0;
var days = 0;  
setInterval(function() {secs = secs + 1
		if (secs >= 60)  {secs = 0 
                     mins = mins + 1}
		if (mins >= 60)  {mins = 0 
                     hours = hours + 1	}
		if (hours >= 24) {hours = 0 
                     days = days + 1 } }, 1000)	
//
//Keep Alive Ping
// 
    app.get("/", (request, response) => {
        console.log(Date.now() + " Ping Received");
        response.sendStatus(200);
    });
    app.listen(process.env.PORT);
        setInterval(() => {
        http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
    }, 240000);
//
//
//	
function clean(text) {
  if (typeof(text) === "string")
    return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
  else
      return text;
}

//
//
//Armed and Ready~
client.on("ready", () => { 
    console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`); 
    client.guilds.filter(g => !settings.has(g.id)).forEach(g => settings.set(g.id, defaultSettings));
//
//to show correct user count it should be here for I dont know reason
//
    var statuslist = [
        "+help <3",
        "as a Cat Meow :3",
        "with Teitoku <3",
        "with +about <3",
        "Teitoku's Ochinchin",
		"@Kashima Shows your Prefix",
        `with ${client.users.size} users`
    ];
    async function kashimafeels () {
        client.user.setActivity(statuslist[Math.floor(Math.random() * statuslist.length)]);
    }
    client.user.setActivity(`is Booting up~`);
    setInterval(kashimafeels, 60000); // change status
//
//end of the changing status
//
//for auto server count post
    setInterval(() => {
        dbl.postStats(client.guilds.size);
    }, 1800000);
});	
//
//
//Guild Add Stuff
//	
client.on("guildCreate", guild => {
   console.log(`New guild joined: ${guild.name} This guild has ${guild.memberCount} members!`);
   settings.set(guild.id, defaultSettings);
});
//
//Guild Remove Stuff
//
client.on("guildDelete", guild => {
    console.log(`I have been removed from: ${guild.name}`);
    settings.delete(guild.id);
});

//	
// Music Function once the command is passed here whatever.
//
async function handleVideo(video, msg, voiceChannel, playlist = false) {
	const serverQueue = queue.get(msg.guild.id);
	console.log(video);
	const song = {
		id: video.id,
		title: Util.escapeMarkdown(video.title),
		url: `https://www.youtube.com/watch?v=${video.id}`
	};
	if (!serverQueue) {
		const queueConstruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true
		};
		queue.set(msg.guild.id, queueConstruct);

		queueConstruct.songs.push(song);

		try {
			var connection = await voiceChannel.join();
			queueConstruct.connection = connection;
			play(msg.guild, queueConstruct.songs[0]);
		} catch (error) {
			console.error(`I could not join the voice channel: ${error}`);
			queue.delete(msg.guild.id);
			return msg.channel.send(`**Teitoku~, Can't join with you in the Voice Channel!**`);
		}
	} else {
		serverQueue.songs.push(song);
		console.log(serverQueue.songs);
		if (playlist) return;
		else return msg.channel.send(`**Teitoku~** __**${song.title}**__ **has been added to the queue!**`);
	}
	return undefined;
};

function play(guild, song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}

	const dispatcher = serverQueue.connection.playStream(ytdl(song.url,{quality: "highestaudio"}, {filter: "audioonly"}))  		
  	.on('end', reason => {
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 7);
	serverQueue.textChannel.send({embed: {
  color: 0xc0c0c0,
  description: `Teitoku, The Song is now __**${song.title}**__`
}});
}; 
// End lul music function lul 
//
// I know my prefix checking is crap do not mention it
client.on('message', async msg => {
    if (msg.author.bot) return;
        const guildConf = settings.get(msg.guild.id);
    if (msg.isMentioned(config.kashimauserid)){
        let yourownprefix = settings.getProp(msg.guild.id, "prefix")
        return msg.channel.send(`**Teitoku**, this **Server Prefix** is set to => **${yourownprefix}**`)};
        if (!msg.content.startsWith(guildConf.prefix)) return; 
    const args = msg.content.split(' ');
	  const searchString = args.slice(1).join(' ');
	  const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
	  let command = msg.content.toLowerCase().split(' ')[0];
	      command = command.slice(guildConf.prefix.length);
    const serverQueue = queue.get(msg.guild.id);
    var usernameosu = args.slice(1).join(' ');
//    
//Music Commands Down This Line    
//
  if (command === 'play') {
	    const voiceChannel = msg.member.voiceChannel;
		if (!voiceChannel) return msg.channel.send('**Please join a voice channel first Teitoku~!**');
		if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/))
    {
			const playlist = await youtube.getPlaylist(url);
			const videos = await playlist.getVideos(80);
			for (const video of Object.values(videos)) {
				const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
				await handleVideo(video2, msg, voiceChannel, true); // eslint-disable-line no-await-in-loop
			}
		 return msg.channel.send(`__**${playlist.title}**__ **has been added to the queue!**`);
    }
	 else {
			try {
				var video = await youtube.getVideo(url);
			} catch (error) {
				try {
					var videos = await youtube.searchVideos(searchString, 6);
					let index = 0;
					msg.channel.send(`**${videos.map(video2 => `${++index} - ${video2.title}`).join('\n')}** \n __**Pick a number from 1-6, Teitoku~!**__`);
          // eslint-disable-next-line max-depth
					try {
						var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
							maxMatches: 1,
							time: 10000,
							errors: ['time']
						});
					} catch (err) {
						console.error(err);
						return msg.channel.send('**(~ -3-)~ Teitoku, do not be a baka, respond on time~**');
					}
					const videoIndex = parseInt(response.first().content);
					var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
				} catch (err) {
					console.error(err);
					return msg.channel.send('**Cannot find anything Teitoku~**');
				}
			}
			return handleVideo(video, msg, voiceChannel);
		};
	}; 
    if (command === 'skip') {
		if (!msg.member.voiceChannel) return msg.channel.send('**Please join a voice channel Teitoku~!**')
		if (!serverQueue) return msg.channel.send('**No Queue list to skip Teitoku~, Add before you skip~!**');
    msg.channel.send('**Skipped the current Music Teitoku~**')
		serverQueue.connection.dispatcher.end();
    serverQueue.connection.playStream
    return 
	};
	if (command === 'stop') {
		if (!msg.member.voiceChannel) return msg.channel.send('**Please join a voice channel Teitoku~!**');
		if (!serverQueue) return msg.channel.send('**No Queue list to stop Teitoku~, Add before you stop~!**');
    serverQueue.songs = [];
		serverQueue.connection.dispatcher.end();
    return msg.channel.send('**Removed the current queue and stopped the music Teitoku~**')
		return undefined;
	};
    if (command === 'queue') {
		if (!serverQueue) return msg.channel.send('**No Queue list to show Teitoku~, Add before you look~!**');
        return msg.channel.send({embed: {
            color: 0xc0c0c0,
            author: {
            name: client.user.username,
            icon_url: client.user.avatarURL
            },
        title: "Queue",
        description: "**Teitoku, Here is the list of Queue**",
            fields: [{
                name: "in this server",
                value:(`In Repairs`/*`${serverQueue.songs.map(song => `**-** ${song.title}`).join('\n')}`*/)
            },
            {        
                name: "Now Playing",
                value:(`${serverQueue.songs[0].title}`)
            }          
            ],
        timestamp: new Date(),
        footer: {
            icon_url: client.user.avatarURL,
            text: "Kashima, second of the Katori-class training cruisers."
                }
            }
        });
    };
/*            
   if (command === 'pause') {
		if (serverQueue && serverQueue.playing) {
			serverQueue.playing = false;
			serverQueue.connection.dispatcher.pause();
			return msg.channel.send('**Paused the music Teitoku**');
		}
		return msg.channel.send('**No music to pause Teitoku~, Add before you pause~!**');
	} if (command === 'resume') {
		if (serverQueue && !serverQueue.playing) {
			serverQueue.playing = true;
			serverQueue.connection.dispatcher.resume();
			return msg.channel.send('**Resumed the music for you!**');
		}
		return msg.channel.send('**No music to resume Teitoku~, Add before you resume~!**');
*/	
// Music End
// Welcome to my written stuff LUL
//
    if (command === 'kashimaidle') {
		const voiceChannel = msg.member.voiceChannel;
		   if (!voiceChannel) return msg.channel.send('**Please join a voice channel first Teitoku~!**');    
       msg.channel.send('**No Teitoku, This Command is on WIP**');
    };
//
// Misc
//
    if (command === 'prefixset') {
    var prefixsetter = args.slice(1).join(' ');
        if (!msg.member.hasPermission("MANAGE_GUILD") && (msg.author.id !==config.ownerid && msg.author.id !== config.coownerid))
            return msg.reply("**You are not allowed to use this command Teitoku~**")
        if(!prefixsetter)
            return msg.reply("**No Prefix Set Teitoku~**")
    settings.setProp(msg.guild.id, "prefix", prefixsetter);
        msg.channel.send(`Teitoku, this **server prefix** is changed to: **${prefixsetter}**`);
    };
//
//
//
    if(command === "ping") {
        const m = await msg.channel.send("**Calculating it for you**");
        m.edit({embed: {
            color: 0xc0c0c0,
            author: {
            name: client.user.username,
            icon_url: client.user.avatarURL
            },
        thumbnail: {
            url: client.user.avatarURL
        },
        title: "Pong",
        description: "Teitoku, Kashima heard you", 
        fields: [{
            name: "Latency",
            value:(`**${m.createdTimestamp - msg.createdTimestamp}ms**`),
            inline: true
        },
        {
            name: "API Latency",
            value:(`**${Math.round(client.ping)}ms**`),
            inline: true
        },
        ],
        timestamp: new Date(),
        footer: {
            icon_url: client.user.avatarURL,
            text: "Kashima, second of the Katori-class training cruisers."
                }
            }
        });
    }
//
//
//    
  if(command === "vote") {
        msg.channel.send({embed: {
        color: 0xc0c0c0,
            author: {
            name: client.user.username,
            icon_url: client.user.avatarURL
            },
        title: "Why Vote?",
        description: "Hosting a bot is never been free Teitoku, but voting shows that you support me, Kashima. Voting also gives Master **Saya#0113** and Co-Owner **.高瀬#9553** motivation and with this I know, I would improve Teitoku~",
            fields: [{
                name: "Please Vote For me ufu~",
                value:(`__https://discordbots.org/bot/424137718961012737__`)
                }
            ],
    timestamp: new Date(),
    footer: {
        icon_url: client.user.avatarURL,
        text: "Kashima, second of the Katori-class training cruisers."
                }
            }
        });
    };
//
//
//    
  if(command === "status") {
    msg.channel.send({embed: {
        color: 0xc0c0c0,
            author: {
            name: client.user.username,
            icon_url: client.user.avatarURL
            },
        title: "Kashima Status",
        description: "Teitoku, this is the results of Kashima's work ufufu",
        "image": {
            "url": "https://thumbs.gfycat.com/AdvancedZealousBetafish-size_restricted.gif"
        },
        fields: [{
            name: "Servers",
            value:(`**${client.guilds.size}** Servers~`),
            inline: true
        },
        {
            name: "Users",
            value:(`**${client.users.size}** Users~`),
            inline: true
        },
        {
            name:"Uptime",
            value:("Teitoku, I'm awake for :\n **" + days + " Days " + hours + " Hours " + mins + " Minutes " + secs + " Seconds~**")
        },
        {
            name: "Kashima Note",
            value:(`Teitoku, expect uptime **resets** due to **restarts on changes**, ufufu~`)
        },
        ],
    timestamp: new Date(),
    footer: {
        icon_url: client.user.avatarURL,
        text: "Kashima, second of the Katori-class training cruisers."
                }
            }
        });
    }; 
//
// Help CMDS are here
//	
  if(command === "help") {
    msg.channel.send({embed: {
        color: 0xc0c0c0,
        author: {
        name: client.user.username,
        icon_url: client.user.avatarURL 
        },
    title: "",
    description: "**My name is Kashima, Checking in Desu, ufufu**",
        "image": {
        "url": "https://thumbs.gfycat.com/UnpleasantBogusArrowworm-size_restricted.gif"
         },
    fields: [{
            name: "Kashima's Support Server",
            value: "https://discordapp.com/invite/8K59VdD"
        },  
        {
            name: "Documentation",
            value: "https://github.com/Deivu/Kashima/blob/master/README.md"
        },     
        {
            name: "Kashima's Prefixes",
            value: "Kashima has the default **+** prefix and it is configurable via **prefixset** command. Sample usage of prefixset with default prefix **+prefixset -**"
        },
        {
            name: "Current Server Prefix",
            value: "You can get your **curent Server Prefix** by mentioning Kashima~"
        },
		    {
            name: "The Misc Commands",
            value: "[prefix]misccmds / +misc | [Details about voting for Kashima is here Teitoku~]"
        },
		    {
            name: "The Fun Commands",
            value: "[prefix]funcmds / +funcmds"
        },
		    {
            name: "The NSFW Commands",
            value: "[prefix]nsfwcmds / +nsfwcmds"
        }, 
        {       
            name: "The Game Commands",
            value: "[prefix]gamecmds / +gamecmds | [Teitoku, Osu is the only available game command for now]"
        },
        {       
            name: "The Mod Commands",
            value: "[prefix]modcmds / +modcmds"
        },
        {       
            name: "The Music Commands",
            value: "[prefix]musiccmds / +musiccmds"
        },
        {
            name: "Restricted Commands",
            value: "[prefix]restrictedcmd / +restrictedcmd"
        } 
	    ],
    timestamp: new Date(),
    footer: {
        icon_url: client.user.avatarURL,
        text: "Kashima, second of the Katori-class training cruisers."
                }
            }
        });
    };
//
//
//	
    if(command === "misccmds") {
    msg.channel.send({embed: {
        color: 0xc0c0c0,
            author: {
            name: client.user.username,
            icon_url: client.user.avatarURL 
            },
        title: "Misc Commands",
        description: "**Here are all the misc commands with info**",
        fields: [{
            name: "[prefix]ping / +ping",
            value: "Kashima will show your ping from Kashima to your server Teitoku~"
        },
        {
            name: "[prefix]prefixset / +prefixset",
            value: "Kashima will change the prefix according on what you want~"
        },
        {
            name: "[prefix]about / +about",
            value: "All about Kashima, Teitoku~"
        },
        {
            name: "[prefix]status / +status",
            value: "Kashima will show you some of the collected Status Teitoku~"
        },
        {
            name: "[prefix]vote / +vote",
            value: "Kashima will show a link for you to vote, it really helps Kashima when you vote, Teitoku~"
        },  
        {
            name: "[prefix]invite / +invite",
            value: "Shall Kashima will go to your server Teitoku?~ (~ ^_^)~"
        },   
        ],
    timestamp: new Date(),
    footer: {
        icon_url: client.user.avatarURL,
        text: "Kashima, second of the Katori-class training cruisers."
                }
            }
        });
    };
//
//
//	
    if(command === "funcmds") {
    msg.channel.send({embed: {
        color: 0xc0c0c0,
            author: {
            name: client.user.username,
            icon_url: client.user.avatarURL 
            },
        title: "Fun Commands",
        description: "**Kashima's Fun Commands, Ranging from Nekos to Cuddles**",
        fields: [{
            name: "[prefix]neko / +neko",
            value: "Kashima will show some **AnimeNeko** Teitoku~ **Safe For Work**"
        },
		    {
            name: "[prefix]ask / +ask",
            value: "Kashima will answer your questions with Yes/Maybe/No or just, ufufu~"
        },
        {
            name: "[prefix]avatar / +avatar",
            value: "Kashima will show your avatar, Teitoku~"
        },
		    {
            name: "[prefix]hug *@mention* / +hug *@mention*",
            value: "Hugs the user you mentioned, defaults to everyone w/o mention if there is no user mentioned, Teitoku~"
        },
        {
            name: "[prefix]kiss *@mention* / +kiss *@mention*",
            value: "Kiss the user you mentioned, defaults to everyone w/o mention if there is no user mentioned, Teitoku~",
        },
        {
            name: "[prefix]poke *@mention* / +poke *@mention*",
            value: "Pokes the user you mentioned, default to notice me senpai/s if there is no user mentioned, Teitoku~",
        },  
        {
            name: "[prefix]pat *@mention* / +pat *@mention*",
            value: "Pats the user you mentioned, defaults to everyone w/o mention if there is no user mentioned, Teitoku~"
        },
        {
            name: "[prefix]tickle *@mention* / +tickle *@mention*",
            value: "Tickles the user you mentioned, defaults to the user who read the message if there is no user mentioned, Teitoku~"
        },		
		    {
            name: "[prefix]slap *@mention* / +slap *@mention*",
            value: "Slaps the user you mentioned, defaults to the user who read the message if there is no user mentioned, Teitoku~"
        },
		    {
			name: "[prefix]cuddle *@mention* / +cuddle *@mention*",
			value: "Cuddles with the user you mentioned, defaults to the user who read the message if there is no user mentioned, Teitoku~"
        }
		],
    timestamp: new Date(),
    footer: {
        icon_url: client.user.avatarURL,
        text: "Kashima, second of the Katori-class training cruisers."
                }
            }
        });
    };
//
//
//
    if(command === "nsfwcmds") {
    msg.channel.send({embed: {
        color: 0xc0c0c0,
            author: {
            name: client.user.username,
            icon_url: client.user.avatarURL 
            },
        title: "NSFW Commands",
        description: "**The Hidden Commands that everybody loves ufu~**",
        fields: [{
            name: "[prefix]hentai / +hentai",
            value: "Some Oppais ufufu~ **Not Safe For Work**"
        },
		{
            name: "[prefix]lewdneko / +lewdneko",
            value: "Some Lewd Anime Nekos ufufu~ **Not Safe For Work**"
        },
		{
            name: "[prefix]lewdnekogif / +lewdnekogif",
            value: "Some Lewd Anime Nekos, that MOVES ufufu~ **Not Safe For Work**"
        },
		{
            name: "[prefix]oppai / +oppai",
            value: "Some Oppais ufufu~ **Not Safe For Work**"
        }
        ],
    timestamp: new Date(),
    footer: {
        icon_url: client.user.avatarURL,
        text: "Kashima, second of the Katori-class training cruisers."
                }
            }
        });
    };
//
//
//
    if(command === "gamecmds") {
    msg.channel.send({embed: {
        color: 0xc0c0c0,
            author: {
            name: client.user.username,
            icon_url: client.user.avatarURL 
            },
        title: "Game commands",
        description: "**Shows details about you on a game ufu~**",
        fields: [{
            name: "[prefix]osustd *user* / +osustd *user*",
            value: "Teitoku, I will show some stats for this user on **Osu Standard**~"
        },
        {
            name: "[prefix]osustdtop *user* / +osustdtop *user*",
            value: "Teitoku, I will show you the top play of this user on **Osu Standard**~",
            inline: true
        },
        {
            name: "[prefix]osumania *user* / +osumania *user*",
            value: "Teitoku, I will show some stats for this user on **Osu Mania**~",
            inline: true
        },  
        {
            name: "[prefix]osumaniatop *user* / +osumaniatop *user*",
            value: "I will show you the top play of this user on **Osu Mania**~"
        }   
        ],
    timestamp: new Date(),
    footer: {
        icon_url: client.user.avatarURL,
        text: "Kashima, second of the Katori-class training cruisers."
                }
            }
        });
    };
//
//
//	
    if(command === "modcmds") {
    msg.channel.send({embed: {
        color: 0xc0c0c0,
            author: {
            name: client.user.username,
            icon_url: client.user.avatarURL 
            },
        title: "Moderator Only Commands",
        description: "**What Admins use to punish bad peoples ufu~**",
        fields: [{
            name: "[prefix]clearmsg / +clearmsg",
            value: "Kashima will delete the last 100 messages in the last 14 days in the channel where you used this Teitoku~"
        },  
        {
            name: "[prefix]kick *@mention reason* / +kick *@mention reason*",
            value: "Kashima will kick the one you hate here Teitoku~ <3"
        },
        {
            name: "[prefix]ban *@mention reason* / +ban *@mention reason*",
            value: "Kashima will make sure that scumbag will never come back again Teitoku~!"
        }
        ],
    timestamp: new Date(),
    footer: {
        icon_url: client.user.avatarURL,
        text: "Kashima, second of the Katori-class training cruisers."
                }
            }
        });
    };
//
//
//	
    if(command === "musiccmds") {
    msg.channel.send({embed: {
        color: 0xc0c0c0,
            author: {
            name: client.user.username,
            icon_url: client.user.avatarURL 
            },
        title: "Music Commands",
        description: "**Here are all my Music Commands Teitoku~**",
        fields: [{
            name: "[prefix]play / +play",
            value: "Teitoku, this command plays a certain youtube video/link. **play** **search term here, youtube link here or playlist link here**"
        },
        {
            name: "[prefix]skip / +skip",
            value: "Teitoku, this skips the current music~",
            inline: true
        },
        {
            name: "[prefix]stop / +stop",
            value: "Teitoku, this command stops the current music and removes all the song from queue",
            inline: true
        },  
        {
            name: "[prefix]queue / +queue",
            value: "Teitoku, This command shows the queue list at your server, as well the now playing song on your server. **__Owner Note__** **I removed the queue part and left the Now Playing I'm fixing some stuff**"
        }   
        ],
    timestamp: new Date(),
    footer: {
        icon_url: client.user.avatarURL,
        text: "Kashima, second of the Katori-class training cruisers."
                }
            }
        });
    };
//
//
//
    if(command === "restrictedcmd") {
    msg.channel.send({embed: {
        color: 0xc0c0c0,
            author: {
            name: client.user.username,
            icon_url: client.user.avatarURL 
            },
        title: "Restricted Commands",
        description: "**You cannot use these, but here for some reason**",
        fields: [{
            name: "[prefix]listguilds / +listguilds",
            value: "Kashima will show all the guilds where she is in **NO ID is collected**"
        },  
        {
            name: "[prefix]fguildsupdate / +fguildsupdate",
            value: "Kashima will manually update here server count to DBL API"
        },
        {
            name: "[prefix]eval / +eval",
            value: "Kashima will eval / run the code you have typed on her"
        }
        ],
    timestamp: new Date(),
    footer: {
        icon_url: client.user.avatarURL,
        text: "Kashima, second of the Katori-class training cruisers."
                }
            }
        });
    };
//
//
//	
    if(command === "about") {
        msg.channel.send({embed: {
        color: 0xc0c0c0,
            author: {
            name: client.user.username,
            icon_url: client.user.avatarURL   
            },
        thumbnail: {
            url: client.user.avatarURL
        },
        title: "About Kashima",
        description: "**Ufufu, these look promising! Eheheh~**",
        fields: [{  
            name: "Who is Kashima?",
            value: "Kashima is a Katori-Class Training Cruiser, She has a blue/gray eyes and a wavy silver hair tied into twintails with a payot on front. Kashima also has a very Feminine Personality which made Master Saya#0113 *Nosebleed at her.*"
        },
        {
            name: "Kashima's Framework",
            value: "**Discord.js v11.3.2**",
        },
        {
            name: "Kashima's version",
            value: "**v1.4.0** | Configurable Prefix, Now Supported",
        },  
        {
            name: "Kashima's Master Teitoku",
            value: "**Saya#0113**",
            inline: true
        },
        {
            name: "Kashima's Co Teitoku",
            value: "**.高瀬#9553**",
            inline: true
        }       
            ],
    timestamp: new Date(),
    footer: {
        icon_url: client.user.avatarURL,
        text: "Kashima, second of the Katori-class training cruisers."
                }
            }
        });
    };
//
//
//	
    if(command === "invite") {
    msg.channel.send({embed: {
        color: 0xc0c0c0,
        author: {
            name: client.user.username,
            icon_url: client.user.avatarURL
            },
        title: "Invite's Kashima to your Server~",
        description: "Do not lewd me or I will lewd you.",
        fields: [{
            name: "This Invite also gives Kashima **Admin Permissions**",
            value: "https://discordapp.com/oauth2/authorize?client_id=424137718961012737&permissions=8&scope=bot"
        },
        ],
    timestamp: new Date(),
    footer: {
        icon_url: client.user.avatarURL,
        text: "Kashima, second of the Katori-class training cruisers."
                }
            }
        });
    };  
//
// Fun Stuff Down this line
//  
    if(command === "ask") {
        var answers = [
            "**Yes Teitoku~**",
            "*Kashima Nods*",
            "**Ufufu, Maybe~**",
            "**I think no Teitoku~**",
            "**Nope~**",
            "**Teitoku, the answer is no~**"
        ]; 
        var askanswer = answers[Math.floor(Math.random() * answers.length)];
        const saymessage = (askanswer)
        msg.channel.send(saymessage);
    };
//
//
//
    if (command === 'neko'){
        nekostuff.getSFWNeko().then(normalneko => {
            const embedneko = new Discord.RichEmbed()
            .setImage(normalneko.url)
            msg.channel.send(embedneko);
            });                                          
    };
//
//
//
    if (command === 'hug'){  
    let member = msg.mentions.members.first();
    var msginvoker = msg.author.tag
        if(!member)
           return nekostuff.getSFWHug().then(freehugs => {
                const embedneko = new Discord.RichEmbed()
                .setDescription(`**${msginvoker}** hugs everyone in the server, ufu <3 ~`)
                .setImage(freehugs.url)
            msg.channel.send(embedneko);
        });            
        nekostuff.getSFWHug().then(freehugs => {
        var hugstuff = [
        `**${msginvoker}** hugs **${member.user.tag}** tightly ufu <3 ~`,
        `**${msginvoker}** gave **${member.user.tag}** a hug ~`,
        `**${msginvoker}** hugged **${member.user.tag}** without any reservations ~`
        ];     
        var huglist = hugstuff[Math.floor(Math.random() * hugstuff.length)]
        const huglist1 = (huglist)
            const embedneko = new Discord.RichEmbed()
            .setDescription(huglist1)
            .setImage(freehugs.url)
        msg.channel.send(embedneko);
        });   
    };
//
//
//
    if (command === 'kiss'){
    let member = msg.mentions.members.first();
    var msginvoker = msg.author.tag
        if(!member)
            return nekostuff.getSFWKiss().then(freekissstuff => {
                const embedneko = new Discord.RichEmbed()
                .setDescription(`**${msginvoker}** Kisses everyone in this server~`)
                .setImage(freekissstuff.url)
            msg.channel.send(embedneko);
        });            
        nekostuff.getSFWKiss().then(freekissstuff => {
        var kissstuff = [
        `**${msginvoker}** kisses **${member.user.tag}** <3 ~`,
        `**${msginvoker}** gave **${member.user.tag}** a kiss, ufu ~`,
        `**${msginvoker}** kissed **${member.user.tag}** deeply ~`
        ];     
        var kisslistrandom = kissstuff[Math.floor(Math.random() * kissstuff.length)]
        const kissu = (kisslistrandom)
           const embedneko = new Discord.RichEmbed()
           .setDescription(kissu)
           .setImage(freekissstuff.url)
        msg.channel.send(embedneko);
        });   
    };
//
//
//
    if (command === 'poke'){
    let member = msg.mentions.members.first();
    var msginvoker = msg.author.tag
        if(!member)
           return nekostuff.getSFWPoke().then(pokethem => {
                const embedneko = new Discord.RichEmbed()
                .setDescription(`Notice **${msginvoker}** senpai/s~`)
                .setImage(pokethem.url)
            msg.channel.send(embedneko);
        });            
        nekostuff.getSFWPoke().then(pokethem=> {
        var pokestuff1 = [
        `**${msginvoker}** Pokes ( •_•)σ **${member.user.tag}** ~`,
        `**${member.user.tag}** Notice me *nyaa* ~`,
        `**${member.user.tag}** is being poked by **${msginvoker}** ~`
        ];     
        var pokelistrandom = pokestuff1 [Math.floor(Math.random() * pokestuff1.length)]
        const pokesu= (pokelistrandom)
            const embedneko = new Discord.RichEmbed()
            .setDescription(pokesu)
            .setImage(pokethem.url)
        msg.channel.send(embedneko);
        });   
    };
//
//
//
    if (command === 'pat'){
    let member = msg.mentions.members.first();
    var msginvoker = msg.author.tag
        if(!member)
           return nekostuff.getSFWPat().then(pats=> {
                const embedneko = new Discord.RichEmbed()
                .setDescription(`**${msginvoker}** everyone in this server ~`)
                .setImage(pats.url)
            msg.channel.send(embedneko);
        });            
        var patstuff = [
        `**${msginvoker}** Pats **${member.user.tag}** ufufu ~`,
        `**${member.user.tag}** here are your free pats from **${msginvoker}** ~`,
        `**${msginvoker}** - (　´Д｀)ﾉ('･ω･')　ﾅﾃﾞﾅﾃﾞ - **${member.user.tag}** `
        ];     
        var patrandom = patstuff [Math.floor(Math.random() * patstuff.length)]
        const pat= (patrandom)
        nekostuff.getSFWPat().then(pats=> {
            const embedneko = new Discord.RichEmbed()
            .setDescription(pat)
            .setImage(pats.url)
        msg.channel.send(embedneko);
        });   
    };
//
//
//
    if (command === 'tickle'){
    let member = msg.mentions.members.first();
    var msginvoker = msg.author.tag
        if(!member)
           return nekostuff.getSFWTickle().then(tickles=> {
                const embedneko = new Discord.RichEmbed()
                .setDescription(`**${msginvoker}** tickles the one who read this message, ufufu ~`)
                .setImage(tickles.url)
        msg.channel.send(embedneko);
        });            
        var ticklestuff = [
        `**${msginvoker}** Tickles **${member.user.tag}** ufufu ~`,
        `**${member.user.tag}** is being tickled by **${msginvoker}** ~`,
        `ヽ( ﾟｰﾟ)ﾉ **${msginvoker}** –→ ;;ﾉ>_<)ﾉ **${member.user.tag}**`
        ];     
        var ticklerandom = ticklestuff [Math.floor(Math.random() * ticklestuff.length)]
        const tickle= (ticklerandom)
        nekostuff.getSFWTickle().then(tickles=> {
            const embedneko = new Discord.RichEmbed()
            .setDescription(tickle)
            .setImage(tickles.url)
        msg.channel.send(embedneko);
        });   
    };
//
//
//
    if (command === 'slap'){
    let member = msg.mentions.members.first();
    var msginvoker = msg.author.tag
        if(!member)
           return nekostuff.getSFWSlap().then(slaps=> {
                const embedneko = new Discord.RichEmbed()
                .setDescription(`**${msginvoker}** slaps the one who read this message, owo ~`)
                .setImage(slaps.url)
            msg.channel.send(embedneko);
        });            
        var slapsstuff = [
        `**${msginvoker}** Slaps **${member.user.tag}** owo~`,
        `**${member.user.tag}** must been a baka to be slapped by **${msginvoker}** ~`,
        `(._+ )☆ **${member.user.tag}** ＼(-.-メ)**${msginvoker}**`
        ];     
        var slapsrandom = slapsstuff [Math.floor(Math.random() * slapsstuff.length)]
        const slap= (slapsrandom)
        nekostuff.getSFWSlap().then(slaps=> {
            const embedneko = new Discord.RichEmbed()
            .setDescription(slap)
            .setImage(slaps.url)
        msg.channel.send(embedneko);
        });   
    };
//
//
//
    if (command === 'cuddle'){
    let member = msg.mentions.members.first();
    var msginvoker = msg.author.tag
        if(!member)
           return nekostuff.getSFWCuddle().then(cuddles=> {
                const embedneko = new Discord.RichEmbed()
                .setDescription(`**${msginvoker}** cuddles with you, who read this. ufufu ~`)
                .setImage(cuddles.url)
            msg.channel.send(embedneko);
        });            
        var cuddlesstuff = [
        `**${msginvoker}** cuddles with **${member.user.tag}** ufufu <3 ~`,
        `**${member.user.tag}** is in the care of **${msginvoker}** ufufu ~`,
        `(⊃･ᴥ･)つ**${msginvoker}** (˘ꇴ˘*)♡ **${member.user.tag}**`
        ];     
        var cuddlesrandom = cuddlesstuff [Math.floor(Math.random() * cuddlesstuff.length)]
        const cuddle= (cuddlesrandom)
        nekostuff.getSFWCuddle().then(cuddles=> {
            const embedneko = new Discord.RichEmbed()
            .setDescription(cuddle)
            .setImage(cuddles.url)
        msg.channel.send(embedneko);
        });   
    };
//
// Lewd Commannds lul for down this line
//
    if (command === 'lewdneko'){
		if (msg.channel.nsfw === false)
		    return msg.channel.send("**Teitoku, this command works only for the NSFW Channels**");
            nekostuff.getNSFWNeko().then(nsfwneko => {
                msg.channel.send(`Pleave vote for me if you like me, use **[prefix]vote / +vote** for more info & why you should vote, and thanks for the support, Teitoku Ufufu~`)
                const embedneko = new Discord.RichEmbed()
                .setDescription(`Here is your meal **Pervert Teitoku**~`)
                .setImage(nsfwneko.url)
            msg.channel.send(embedneko);
            });                                          
    };
//
//
//
    if (command === 'lewdnekogif'){
		if (msg.channel.nsfw === false)
		    return msg.channel.send("**Teitoku, this command works only for the NSFW Channels**");
            nekostuff.getNSFWNekoGif().then(nsfwnekogif => {
                msg.channel.send(`Pleave vote for me if you like me, use **[prefix]vote / +vote** for more info & why you should vote, and thanks for the support, Teitoku Ufufu~`)
                const embedneko = new Discord.RichEmbed()
                .setDescription(`Here is your meal **Pervert Teitoku**~`)
                .setImage(nsfwnekogif.url)
            msg.channel.send(embedneko);
            });                                          
    };
//
//
//
    if (command === 'oppai'){
		if (msg.channel.nsfw === false)
		    return msg.channel.send("**Teitoku, this command works only for the NSFW Channels**");
             nekostuff.getNSFWBoobs().then(oppai => {
                msg.channel.send(`Pleave vote for me if you like me, use **[prefix]vote / +vote** for more info & why you should vote, and thanks for the support, Teitoku Ufufu~`)
                const embedneko = new Discord.RichEmbed()
                .setDescription(`Here is your meal **Pervert Teitoku**~`)
                .setImage(oppai.url)
            msg.channel.send(embedneko);
            });                                          
    };
//
//
//	
	if (command === 'hentai'){
		if (msg.channel.nsfw === false)
		    return msg.channel.send("**Teitoku, this command works only for the NSFW Channels**");
             nekostuff.getNSFWRandomHentaiGif().then(hentai => {
                msg.channel.send(`Pleave vote for me if you like me, use **[prefix]vote / +vote** for more info & why you should vote, and thanks for the support, Teitoku Ufufu~`)
                const embedneko = new Discord.RichEmbed()
                .setDescription(`Here is your meal **Pervert Teitoku**~`)
                .setImage(hentai.url)
            msg.channel.send(embedneko);
            });                                          
    };
//
//
//
    if(command ==="osustd"){
    if(!usernameosu)
        return msg.channel.send(`Teitoku, you need to **mention a specific user for this to work** ufu~`);
    osuapi.getUser({
    "u": usernameosu,
    "m": 0
    }).then(function(osustatsget) {
        const embedosu = new Discord.RichEmbed()
        .setThumbnail("https://lemmmy.pw/osusig/img/osu.png")
        .addField(`Country`,
            osustatsget[0].country, true)
        .addField(`Username`,
            osustatsget[0].username,true)
        .addField(`Accuracy`,
            Math.round(osustatsget[0].accuracy), true)
        .addField(`Performance Points`,
            osustatsget[0].pp_raw, true)
        .addField(`Global Rank`,
            osustatsget[0].pp_rank, true)
        .addField(`Country Rank`,
            osustatsget[0]. pp_country_rank, true)   
    console.log(osustatsget);
    msg.channel.send(embedosu);
        });                                          
};
    if(command ==="osustdtop"){
    if(!usernameosu)
        return msg.channel.send(`Teitoku, you need to **mention a specific user for this to work** ufu~`);
    osuapi.getUserBest({
    "u": usernameosu,
    "m": 0,
    "limit": 1
    }).then(function(osustatsget) {
    osuapi.getBeatmaps({
    "b": osustatsget[0].beatmap_id,
    "m": 0
    }).then(function(osubeatmaptitle) {
        const embedosu = new Discord.RichEmbed()
        .setThumbnail("https://lemmmy.pw/osusig/img/osu.png")
        .addField(`Beatmap`,
            osubeatmaptitle[0].title)
        .addField(`Score`,
            osustatsget[0].score)
        .addField(`Date`,
            osustatsget[0].date, true)
        .addField(`Performance Points`,
            osustatsget[0].pp, true)
    msg.channel.send(embedosu);
        });   
   });
};
    if(command ==="osumania"){
    if(!usernameosu)
        return msg.channel.send(`Teitoku, you need to **mention a specific user for this to work** ufu~`);
    osuapi.getUser({
    "u": usernameosu,
    "m": 3
    }).then(function(osustatsget) {
        const embedosu = new Discord.RichEmbed()
        .setThumbnail("https://lemmmy.pw/osusig/img/mania.png")
        .addField(`Country`,
            osustatsget[0].country, true)
        .addField(`Username`,
            osustatsget[0].username,true)
        .addField(`Accuracy`,
            Math.round(osustatsget[0].accuracy), true)
        .addField(`Performance Points`,
            osustatsget[0].pp_raw, true)
        .addField(`Global Rank`,
            osustatsget[0].pp_rank, true)
        .addField(`Country Rank`,
            osustatsget[0]. pp_country_rank, true)   
        msg.channel.send(embedosu);
        });
};
    if(command ==="osumaniatop"){
    if(!usernameosu)
        return msg.channel.send(`Teitoku, you need to **mention a specific user for this to work** ufu~`);
    osuapi.getUserBest({
    "u": usernameosu,
    "m": 3,
    "limit": 1
    }).then(function(osustatsget) {
    osuapi.getBeatmaps({
    "b": osustatsget[0].beatmap_id,
    "m": 3
    }).then(function(osubeatmaptitle) {
        const embedosu = new Discord.RichEmbed()
        .setThumbnail("https://lemmmy.pw/osusig/img/mania.png")
        .addField(`Beatmap`,
            osubeatmaptitle[0].title)
        .addField(`Score`,
            osustatsget[0].score)
        .addField(`Date`,
            osustatsget[0].date, true)
        .addField(`Performance Points`,
            osustatsget[0].pp, true)
        msg.channel.send(embedosu);
        });   
   });
};

//
// Moderator Commands Down this line
//	
    if(command === "kick") {
        if(!msg.member.hasPermission("KICK_MEMBERS"))
            return msg.reply("Teitoku, this command is only available for those who have **KICK_MEMBERS** permission~");
        
    let member = msg.mentions.members.first() 
        if(!member)
            return msg.reply("**Teitoku, in order for me to kick someone, Mention a user to kick ufu~**");
        if(!member.kickable) 
            return msg.reply("**Kyaa! No way, Teitoku, I can't kick this user!**");
	
    let reason = args.slice(1).join(' ');
        if(!reason)
            return msg.reply("**You must mention a reason for kick, Teitoku~**");
            await member.kick(reason)
        .catch(error => msg.reply(`Teitoku, sorry, I couldn't kick **because of : ${error}**`));
    msg.reply(`${member.user.tag} has been kicked by Teitoku ${msg.author.tag} because of **${reason}** ufu~`);
    };
//
//
// 
   if(command === "ban") {    
       if(!msg.member.hasPermission("BAN_MEMBERS"))
            return msg.reply("Teitoku, this command is only available for those who have **BAN_MEMBERS** permission~");
      
    let member = msg.mentions.members.first() 
        if(!member)
            return msg.reply("**Teitoku, in order for me to ban someone, Mention a user to ban ufu~**");
        if(!member.bannable) 
            return msg.reply("**No... it's so... nooo... Teitoku... I cannot ban this user**");

    let reason = args.slice(1).join(' ');
        if(!reason)
            return msg.reply("**You must mention a reason for ban, Teitoku~**");
    
        await member.ban(reason)
        .catch(error => msg.reply(`Teitoku, sorry, I couldn't ban **because of : ${error}**`));
    msg.reply(`${member.user.tag} has been banned by Teitoku ${msg.author.tag} because of **${reason}** ufu~`);
    };
//
//
//    
    if (command === "clearmsg") {
    if(!msg.member.hasPermission("MANAGE_MESSAGES"))
        return msg.reply("Teitoku, this command is only available for those who have **MANAGE_MESSAGES** permission~")
    msg.channel.bulkDelete(100).then(() => {
    msg.channel.send("**Teitoku, I sucessfully deleted the messages~~**").then(msg => msg.delete(5000));
        });
    };
//
//
//    
    if(command === "avatar") {
    const embed = new Discord.RichEmbed()
    var msginvoker = msg.author.tag
       .setDescription(`The Avatar of **${msginvoker}**`)
       .setImage(msg.author.avatarURL)
    msg.channel.send({embed})
    };
//
//
// Down this line lies the Owner Commands and Co-Teitoku Commands
//
//
   if(command === "listguilds") { 
   if (msg.author.id !==config.ownerid && msg.author.id !== config.coownerid)
		  return msg.reply("**Teitoku, this command is restricted and for Master Teitoku / Co-Teitoku use only ufu~**");
          msg.channel.send("**Oh, do you want to see the numbers? I'll bring them, okay? Ufu.**")
          msg.author.send("**Guilds where am I, Teitoku**");
          client.guilds.forEach(guild => msg.author.send(guild.name))
          msg.author.send("**--END--**");
    };
   if(command === "fguildsupdate") {
   if (msg.author.id !==config.ownerid && msg.author.id !== config.coownerid)
		  return msg.reply("**Teitoku, this command is restricted and for Master Teitoku / Co-Teitoku use only ufu~**");
      msg.channel.send(`Commencing manual status update as per your request ufu~`);
          dbl.postStats(client.guilds.size);
      msg.channel.send(`Updated with **${client.guilds.size} Servers** Teitoku ufu~`);
    }
   if (command === "eval") {
   if (msg.author.id !==config.ownerid && msg.author.id !== config.coownerid)
      return msg.reply("**Teitoku, this command is restricted and for Master Teitoku / Co-Teitoku use only ufu~**");
      const args = msg.content.split(" ").slice(1);
      try {
        const code = args.join(" ");
        let evaled = eval(code);
        if (typeof evaled !== "string")
          evaled = require("util").inspect(evaled);
        msg.channel.send(clean(evaled), {code:"xl"});
      } catch (err) {
        msg.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
      }
    }
});
//END LUL The hell with this? LOL
client.login(config.token);