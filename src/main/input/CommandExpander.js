export class CommandExpander {

    expand(message) {
        let result = message;

        let previous;

        do {
            previous = result;

            result = result.replace(
                /\[([^\]]+)]\*(\d+)/g,
                (_, command, count) => {
                    return Array(Number(count))
                        .fill(command)
                        .join(" ");
                }
            );

        } while (result !== previous);

        return result;
    }
}