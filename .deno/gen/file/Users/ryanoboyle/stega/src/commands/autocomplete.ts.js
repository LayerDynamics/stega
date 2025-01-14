export const autocompleteCommand = {
  name: "autocomplete",
  description: "Generate shell autocompletion scripts",
  options: [
    {
      name: "shell",
      alias: "s",
      type: "string",
      description: "Shell type (bash, zsh, fish)",
      required: true
    }
  ],
  action: async (args)=>{
    const cli = args.cli;
    const shell = args.flags.shell;
    const commands = cli.getCommands().map((cmd)=>cmd.name).join(" ");
    switch(shell){
      case "bash":
        console.log(generateBashCompletion(commands));
        break;
      case "zsh":
        console.log(generateZshCompletion(commands));
        break;
      case "fish":
        console.log(generateFishCompletion(commands));
        break;
      default:
        console.error(cli.i18n.t("unsupported_shell", {
          shell
        }));
        Deno.exit(1);
    }
  }
};
function generateBashCompletion(commands) {
  return `# Bash completion script for stega
_stega_completion() {
    local cur prev commands
    commands="${commands}"
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"

    case "\${prev}" in
        stega)
            COMPREPLY=( $(compgen -W "\${commands}" -- "\${cur}") )
            return 0
            ;;
        *)
            COMPREPLY=()
            return 0
            ;;
    esac
}

complete -F _stega_completion stega`;
}
function generateZshCompletion(commands) {
  return `#compdef stega

_stega() {
    local -a commands
    commands=(${commands.split(" ").map((cmd)=>`"${cmd}:stega command"`).join(" ")})

    _arguments '1: :->command' '*: :->args'

    case $state in
        command)
            _describe 'command' commands
            ;;
    esac
}

_stega`;
}
function generateFishCompletion(commands) {
  return `# Fish completion for stega
complete -c stega -f
${commands.split(" ").map((cmd)=>`complete -c stega -n "__fish_use_subcommand" -a "${cmd}" -d "stega command"`).join("\n")}`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS9zcmMvY29tbWFuZHMvYXV0b2NvbXBsZXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbW1hbmQgfSBmcm9tIFwiLi4vY29yZS50c1wiO1xuaW1wb3J0IHsgQ0xJIH0gZnJvbSBcIi4uL2NvcmUudHNcIjtcblxuZXhwb3J0IGNvbnN0IGF1dG9jb21wbGV0ZUNvbW1hbmQ6IENvbW1hbmQgPSB7XG5cdG5hbWU6IFwiYXV0b2NvbXBsZXRlXCIsXG5cdGRlc2NyaXB0aW9uOiBcIkdlbmVyYXRlIHNoZWxsIGF1dG9jb21wbGV0aW9uIHNjcmlwdHNcIixcblx0b3B0aW9uczogW1xuXHRcdHtcblx0XHRcdG5hbWU6IFwic2hlbGxcIixcblx0XHRcdGFsaWFzOiBcInNcIixcblx0XHRcdHR5cGU6IFwic3RyaW5nXCIsXG5cdFx0XHRkZXNjcmlwdGlvbjogXCJTaGVsbCB0eXBlIChiYXNoLCB6c2gsIGZpc2gpXCIsXG5cdFx0XHRyZXF1aXJlZDogdHJ1ZSxcblx0XHR9LFxuXHRdLFxuXHRhY3Rpb246IGFzeW5jIChhcmdzKSA9PiB7XG5cdFx0Y29uc3QgY2xpID0gYXJncy5jbGkgYXMgQ0xJO1xuXHRcdGNvbnN0IHNoZWxsID0gYXJncy5mbGFncy5zaGVsbCBhcyBzdHJpbmc7XG5cdFx0Y29uc3QgY29tbWFuZHMgPSBjbGkuZ2V0Q29tbWFuZHMoKS5tYXAoKGNtZCkgPT4gY21kLm5hbWUpLmpvaW4oXCIgXCIpO1xuXG5cdFx0c3dpdGNoIChzaGVsbCkge1xuXHRcdFx0Y2FzZSBcImJhc2hcIjpcblx0XHRcdFx0Y29uc29sZS5sb2coZ2VuZXJhdGVCYXNoQ29tcGxldGlvbihjb21tYW5kcykpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgXCJ6c2hcIjpcblx0XHRcdFx0Y29uc29sZS5sb2coZ2VuZXJhdGVac2hDb21wbGV0aW9uKGNvbW1hbmRzKSk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBcImZpc2hcIjpcblx0XHRcdFx0Y29uc29sZS5sb2coZ2VuZXJhdGVGaXNoQ29tcGxldGlvbihjb21tYW5kcykpO1xuXG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0Y29uc29sZS5lcnJvcihjbGkuaTE4bi50KFwidW5zdXBwb3J0ZWRfc2hlbGxcIiwgeyBzaGVsbCB9KSk7XG5cdFx0XHRcdERlbm8uZXhpdCgxKTtcblx0XHR9XG5cdH0sXG59O1xuXG5mdW5jdGlvbiBnZW5lcmF0ZUJhc2hDb21wbGV0aW9uKGNvbW1hbmRzOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRyZXR1cm4gYCMgQmFzaCBjb21wbGV0aW9uIHNjcmlwdCBmb3Igc3RlZ2Fcbl9zdGVnYV9jb21wbGV0aW9uKCkge1xuICAgIGxvY2FsIGN1ciBwcmV2IGNvbW1hbmRzXG4gICAgY29tbWFuZHM9XCIke2NvbW1hbmRzfVwiXG4gICAgY3VyPVwiXFwke0NPTVBfV09SRFNbQ09NUF9DV09SRF19XCJcbiAgICBwcmV2PVwiXFwke0NPTVBfV09SRFNbQ09NUF9DV09SRC0xXX1cIlxuXG4gICAgY2FzZSBcIlxcJHtwcmV2fVwiIGluXG4gICAgICAgIHN0ZWdhKVxuICAgICAgICAgICAgQ09NUFJFUExZPSggJChjb21wZ2VuIC1XIFwiXFwke2NvbW1hbmRzfVwiIC0tIFwiXFwke2N1cn1cIikgKVxuICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgICAgIDs7XG4gICAgICAgICopXG4gICAgICAgICAgICBDT01QUkVQTFk9KClcbiAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgICAgICA7O1xuICAgIGVzYWNcbn1cblxuY29tcGxldGUgLUYgX3N0ZWdhX2NvbXBsZXRpb24gc3RlZ2FgO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZVpzaENvbXBsZXRpb24oY29tbWFuZHM6IHN0cmluZyk6IHN0cmluZyB7XG5cdHJldHVybiBgI2NvbXBkZWYgc3RlZ2FcblxuX3N0ZWdhKCkge1xuICAgIGxvY2FsIC1hIGNvbW1hbmRzXG4gICAgY29tbWFuZHM9KCR7XG5cdFx0Y29tbWFuZHMuc3BsaXQoXCIgXCIpLm1hcCgoY21kKSA9PiBgXCIke2NtZH06c3RlZ2EgY29tbWFuZFwiYCkuam9pbihcIiBcIilcblx0fSlcblxuICAgIF9hcmd1bWVudHMgJzE6IDotPmNvbW1hbmQnICcqOiA6LT5hcmdzJ1xuXG4gICAgY2FzZSAkc3RhdGUgaW5cbiAgICAgICAgY29tbWFuZClcbiAgICAgICAgICAgIF9kZXNjcmliZSAnY29tbWFuZCcgY29tbWFuZHNcbiAgICAgICAgICAgIDs7XG4gICAgZXNhY1xufVxuXG5fc3RlZ2FgO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUZpc2hDb21wbGV0aW9uKGNvbW1hbmRzOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRyZXR1cm4gYCMgRmlzaCBjb21wbGV0aW9uIGZvciBzdGVnYVxuY29tcGxldGUgLWMgc3RlZ2EgLWZcbiR7XG5cdFx0Y29tbWFuZHMuc3BsaXQoXCIgXCIpLm1hcCgoY21kKSA9PlxuXHRcdFx0YGNvbXBsZXRlIC1jIHN0ZWdhIC1uIFwiX19maXNoX3VzZV9zdWJjb21tYW5kXCIgLWEgXCIke2NtZH1cIiAtZCBcInN0ZWdhIGNvbW1hbmRcImBcblx0XHQpLmpvaW4oXCJcXG5cIilcblx0fWA7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0EsT0FBTyxNQUFNLHNCQUErQjtFQUMzQyxNQUFNO0VBQ04sYUFBYTtFQUNiLFNBQVM7SUFDUjtNQUNDLE1BQU07TUFDTixPQUFPO01BQ1AsTUFBTTtNQUNOLGFBQWE7TUFDYixVQUFVO0lBQ1g7R0FDQTtFQUNELFFBQVEsT0FBTztJQUNkLE1BQU0sTUFBTSxLQUFLLEdBQUc7SUFDcEIsTUFBTSxRQUFRLEtBQUssS0FBSyxDQUFDLEtBQUs7SUFDOUIsTUFBTSxXQUFXLElBQUksV0FBVyxHQUFHLEdBQUcsQ0FBQyxDQUFDLE1BQVEsSUFBSSxJQUFJLEVBQUUsSUFBSSxDQUFDO0lBRS9ELE9BQVE7TUFDUCxLQUFLO1FBQ0osUUFBUSxHQUFHLENBQUMsdUJBQXVCO1FBQ25DO01BQ0QsS0FBSztRQUNKLFFBQVEsR0FBRyxDQUFDLHNCQUFzQjtRQUNsQztNQUNELEtBQUs7UUFDSixRQUFRLEdBQUcsQ0FBQyx1QkFBdUI7UUFFbkM7TUFDRDtRQUNDLFFBQVEsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxxQkFBcUI7VUFBRTtRQUFNO1FBQ3RELEtBQUssSUFBSSxDQUFDO0lBQ1o7RUFDRDtBQUNELEVBQUU7QUFFRixTQUFTLHVCQUF1QixRQUFnQjtFQUMvQyxPQUFPLENBQUM7OztjQUdLLEVBQUUsU0FBUzs7Ozs7Ozs7Ozs7Ozs7OzttQ0FnQlUsQ0FBQztBQUNwQztBQUVBLFNBQVMsc0JBQXNCLFFBQWdCO0VBQzlDLE9BQU8sQ0FBQzs7OztjQUlLLEVBQ1osU0FBUyxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxNQUFRLENBQUMsQ0FBQyxFQUFFLElBQUksZUFBZSxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQ2hFOzs7Ozs7Ozs7OztNQVdJLENBQUM7QUFDUDtBQUVBLFNBQVMsdUJBQXVCLFFBQWdCO0VBQy9DLE9BQU8sQ0FBQzs7QUFFVCxFQUNFLFNBQVMsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsTUFDeEIsQ0FBQyxpREFBaUQsRUFBRSxJQUFJLG9CQUFvQixDQUFDLEVBQzVFLElBQUksQ0FBQyxNQUNQLENBQUM7QUFDSCJ9
// denoCacheMetadata=13614586431388570168,1619859500201813062