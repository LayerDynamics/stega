// src/autocomplete.ts
export const autocompleteCommand = {
  name: "autocomplete",
  description: "Generate shell autocomplete scripts",
  options: [
    {
      name: "shell",
      alias: "s",
      type: "string",
      description: "Shell type (bash, zsh, fish)",
      required: true
    }
  ],
  action: (args)=>{
    const shell = args.flags.shell;
    let script = "";
    switch(shell){
      case "bash":
        script = generateBashCompletion();
        break;
      case "zsh":
        script = generateZshCompletion();
        break;
      case "fish":
        script = generateFishCompletion();
        break;
      default:
        console.error(`Unsupported shell: ${shell}`);
        Deno.exit(1);
    }
    console.log(script);
  }
};
/**
 * Placeholder functions to generate completion scripts.
 * Implement actual script generation based on command registry.
 */ function generateBashCompletion() {
  return `# Bash completion script for Stega
_stega_completion() {
    COMPREPLY=($(compgen -W "$(stega help | grep '^  ' | awk '{print $1}')" -- "\\\${COMP_WORDS[COMP_CWORD]}"))
}
complete -F _stega_completion stega`;
}
function generateZshCompletion() {
  return `# Zsh completion script for Stega
#compdef stega

_stega_completion() {
    local commands
    commands=$(stega help | grep '^  ' | awk '{print $1}')
    _arguments "1: :(\\\${commands})"
}

compdef _stega_completion stega`;
}
function generateFishCompletion() {
  return `# Fish completion script for Stega
complete -c stega -f -a "(stega help | grep '^  ' | awk '{print $1}')" -d "Available commands"`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS9zcmMvYXV0b2NvbXBsZXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIHNyYy9hdXRvY29tcGxldGUudHNcbmltcG9ydCB7IENvbW1hbmQgfSBmcm9tIFwiLi9jb3JlLnRzXCI7XG5cbmV4cG9ydCBjb25zdCBhdXRvY29tcGxldGVDb21tYW5kOiBDb21tYW5kID0ge1xuXHRuYW1lOiBcImF1dG9jb21wbGV0ZVwiLFxuXHRkZXNjcmlwdGlvbjogXCJHZW5lcmF0ZSBzaGVsbCBhdXRvY29tcGxldGUgc2NyaXB0c1wiLFxuXHRvcHRpb25zOiBbXG5cdFx0e1xuXHRcdFx0bmFtZTogXCJzaGVsbFwiLFxuXHRcdFx0YWxpYXM6IFwic1wiLFxuXHRcdFx0dHlwZTogXCJzdHJpbmdcIixcblx0XHRcdGRlc2NyaXB0aW9uOiBcIlNoZWxsIHR5cGUgKGJhc2gsIHpzaCwgZmlzaClcIixcblx0XHRcdHJlcXVpcmVkOiB0cnVlLFxuXHRcdH0sXG5cdF0sXG5cdGFjdGlvbjogKGFyZ3MpID0+IHtcblx0XHRjb25zdCBzaGVsbCA9IGFyZ3MuZmxhZ3Muc2hlbGwgYXMgc3RyaW5nO1xuXHRcdGxldCBzY3JpcHQgPSBcIlwiO1xuXG5cdFx0c3dpdGNoIChzaGVsbCkge1xuXHRcdFx0Y2FzZSBcImJhc2hcIjpcblx0XHRcdFx0c2NyaXB0ID0gZ2VuZXJhdGVCYXNoQ29tcGxldGlvbigpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgXCJ6c2hcIjpcblx0XHRcdFx0c2NyaXB0ID0gZ2VuZXJhdGVac2hDb21wbGV0aW9uKCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBcImZpc2hcIjpcblx0XHRcdFx0c2NyaXB0ID0gZ2VuZXJhdGVGaXNoQ29tcGxldGlvbigpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoYFVuc3VwcG9ydGVkIHNoZWxsOiAke3NoZWxsfWApO1xuXHRcdFx0XHREZW5vLmV4aXQoMSk7XG5cdFx0fVxuXG5cdFx0Y29uc29sZS5sb2coc2NyaXB0KTtcblx0fSxcbn07XG5cbi8qKlxuICogUGxhY2Vob2xkZXIgZnVuY3Rpb25zIHRvIGdlbmVyYXRlIGNvbXBsZXRpb24gc2NyaXB0cy5cbiAqIEltcGxlbWVudCBhY3R1YWwgc2NyaXB0IGdlbmVyYXRpb24gYmFzZWQgb24gY29tbWFuZCByZWdpc3RyeS5cbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVCYXNoQ29tcGxldGlvbigpOiBzdHJpbmcge1xuXHRyZXR1cm4gYCMgQmFzaCBjb21wbGV0aW9uIHNjcmlwdCBmb3IgU3RlZ2Fcbl9zdGVnYV9jb21wbGV0aW9uKCkge1xuICAgIENPTVBSRVBMWT0oJChjb21wZ2VuIC1XIFwiJChzdGVnYSBoZWxwIHwgZ3JlcCAnXiAgJyB8IGF3ayAne3ByaW50ICQxfScpXCIgLS0gXCJcXFxcXFwke0NPTVBfV09SRFNbQ09NUF9DV09SRF19XCIpKVxufVxuY29tcGxldGUgLUYgX3N0ZWdhX2NvbXBsZXRpb24gc3RlZ2FgO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZVpzaENvbXBsZXRpb24oKTogc3RyaW5nIHtcblx0cmV0dXJuIGAjIFpzaCBjb21wbGV0aW9uIHNjcmlwdCBmb3IgU3RlZ2FcbiNjb21wZGVmIHN0ZWdhXG5cbl9zdGVnYV9jb21wbGV0aW9uKCkge1xuICAgIGxvY2FsIGNvbW1hbmRzXG4gICAgY29tbWFuZHM9JChzdGVnYSBoZWxwIHwgZ3JlcCAnXiAgJyB8IGF3ayAne3ByaW50ICQxfScpXG4gICAgX2FyZ3VtZW50cyBcIjE6IDooXFxcXFxcJHtjb21tYW5kc30pXCJcbn1cblxuY29tcGRlZiBfc3RlZ2FfY29tcGxldGlvbiBzdGVnYWA7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlRmlzaENvbXBsZXRpb24oKTogc3RyaW5nIHtcblx0cmV0dXJuIGAjIEZpc2ggY29tcGxldGlvbiBzY3JpcHQgZm9yIFN0ZWdhXG5jb21wbGV0ZSAtYyBzdGVnYSAtZiAtYSBcIihzdGVnYSBoZWxwIHwgZ3JlcCAnXiAgJyB8IGF3ayAne3ByaW50ICQxfScpXCIgLWQgXCJBdmFpbGFibGUgY29tbWFuZHNcImA7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsc0JBQXNCO0FBR3RCLE9BQU8sTUFBTSxzQkFBK0I7RUFDM0MsTUFBTTtFQUNOLGFBQWE7RUFDYixTQUFTO0lBQ1I7TUFDQyxNQUFNO01BQ04sT0FBTztNQUNQLE1BQU07TUFDTixhQUFhO01BQ2IsVUFBVTtJQUNYO0dBQ0E7RUFDRCxRQUFRLENBQUM7SUFDUixNQUFNLFFBQVEsS0FBSyxLQUFLLENBQUMsS0FBSztJQUM5QixJQUFJLFNBQVM7SUFFYixPQUFRO01BQ1AsS0FBSztRQUNKLFNBQVM7UUFDVDtNQUNELEtBQUs7UUFDSixTQUFTO1FBQ1Q7TUFDRCxLQUFLO1FBQ0osU0FBUztRQUNUO01BQ0Q7UUFDQyxRQUFRLEtBQUssQ0FBQyxDQUFDLG1CQUFtQixFQUFFLE1BQU0sQ0FBQztRQUMzQyxLQUFLLElBQUksQ0FBQztJQUNaO0lBRUEsUUFBUSxHQUFHLENBQUM7RUFDYjtBQUNELEVBQUU7QUFFRjs7O0NBR0MsR0FDRCxTQUFTO0VBQ1IsT0FBTyxDQUFDOzs7O21DQUkwQixDQUFDO0FBQ3BDO0FBRUEsU0FBUztFQUNSLE9BQU8sQ0FBQzs7Ozs7Ozs7OytCQVNzQixDQUFDO0FBQ2hDO0FBRUEsU0FBUztFQUNSLE9BQU8sQ0FBQzs4RkFDcUYsQ0FBQztBQUMvRiJ9
// denoCacheMetadata=3051224536409884358,17149105736686300648