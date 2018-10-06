const TOKEN = {
    EMPTY: '',
//    LEFT: "(", 
 //   RIGHT: ")",
    EQUAL: "=",
    SEMCOL: ";", 
  //  PLUS: "+",
  //  MINUS: "-",
 //   STAR: "*",
    SLASH: "/",
  //  COMMA: ",",
    OPENTAG: '<',
    CLOSETAG: '>',
    DOUBLEPRIME: '"',
    STRING: "string",
    IDENT: "ident",
    NUMBER: "number",
    EOF: "eof",
    valueOf: (val) => {
    //    if(val == '(') return TOKEN.LEFT;
     //   if(val == ')') return TOKEN.RIGHT;
        if(val == '=') return TOKEN.EQUAL;
        if(val == ';') return TOKEN.SEMCOL;
     //   if(val == '+') return TOKEN.PLUS;
    //    if(val == '-') return TOKEN.MINUS;
      //  if(val == '*') return TOKEN.STAR;
        if(val == '/') return TOKEN.SLASH;
//        if(val == ',') return TOKEN.COMMA;
        if(val == '<') return TOKEN.OPENTAG;
        if(val == '>') return TOKEN.CLOSETAG;
        if(val == '"') return TOKEN.DOUBLEPRIME;
        if(val == 'string') return TOKEN.STRING;
        if(val == 'ident') return TOKEN.IDENT;
        if(val == 'number') return TOKEN.NUMBER;
        return TOKEN.EOF;
    }
}

class Element {
    // type can be whether closing tag(false), opening tag(true)
    constructor(start, child, end)  {
        this.start = start;
        this.child = child;
        this.end = end;
    }
}

const TagType = {
    START: 'start', // <tag> 
    END: 'end', // </tag>
    VOID: 'void' // <tag />
}
class Tag {
    
    constructor(type, name, attrs) {
        this.type = type;
        this.name = name;
        this.attrs = attrs;
    }

    toString() {
        let str='<';
        if(this.type == TagType.END) {
            str += "/";
        }

        str += this.name;

        for(const accessor in this.attrs) {
            str += ' ' + this.attrs[accessor];
        }
        
        str += '>';
        return str;
    }
}

class Attribute {
    constructor(name, val) {
        this.name = name;
        this.val = val;
    }

    toString() {
        return this.name + '=' + this.val;
    }
}

class Scanner {
    constructor(input) {
        this.source = input;
        this.prev = 0;
        this.next = 0;

        this.sval = '';
    }

    nextToken() {
        this.sval = '';
        let c;

        do {
            if (this.next >= this.source.length) return (this.tok = TOKEN.EOF);
            c = this.source.charAt(this.next++);  //read next char  
        } while (Scanner.isWhiteSpace(c));

        this.prev = this.next-1;
        if(c == TOKEN.DOUBLEPRIME) this.getString();
        else if (Scanner.isLetter(c)) this.getIdent();
        else this.tok = TOKEN.valueOf(c);  //tok = c;
        return this.tok;
    }

    getString() {
        while (this.next < this.source.length) {
            let c = this.source.charAt(this.next++);
            if (c == TOKEN.DOUBLEPRIME) break;
        }
        this.sval = this.source.substring(this.prev, this.next);
        this.tok = TOKEN.STRING;
    }

    getIdent() {
        while (this.next < this.source.length) {
            let c = this.source.charAt(this.next);
            if (Scanner.isLetter(c) || Scanner.isDigit(c)) this.next++;
            else break;
        }
        this.sval = this.source.substring(this.prev, this.next);
        this.tok = TOKEN.IDENT;
    }

    static isWhiteSpace(character) {
        return character.length === 1 && /\s/.test(character);
    }

    static isLetter(character) {
        return character.length === 1 && /[a-z.,]/i.test(character);
    }

    static isDigit(character) {
        return character.length === 1 && /^\d+$/.test(character);
    }

}

class Parser {
    constructor(input) {
        this.lexer = new Scanner(input);
        this.tok = TOKEN.EMPTY;
    }

    match(token) {
        if(this.tok == token) {
            this.tok = this.lexer.nextToken();
        } else{
            this.expected(token);  
        } 
    }
    expected(s) {
        new Error('Expected: '+s+', Found: ' + this.tok);
    }

    parse() {
        this.tok = this.lexer.nextToken();

        let html='';
        while(this.tok != TOKEN.EOF) {
            html += this.tag(); // should call element();
        }

        return html;
    }

    element() {
        // ??? 
    }

    tag() {
        if(this.tok == TOKEN.OPENTAG) {
            this.match(this.tok);

            let type;
            if(this.tok == TOKEN.SLASH) {
                this.match(TOKEN.SLASH);
                type = TagType.END;
            } else {
                type = TagType.START;
            }
            
            let tagName = this.lexer.sval;
            this.match(TOKEN.IDENT);

            let attributes = [];
            while(this.tok != TOKEN.CLOSETAG) { // attributes
                attributes.push(this.attr());
            }

            this.match(TOKEN.CLOSETAG);

            return new Tag(type, tagName, attributes);
        } else if (this.tok == TOKEN.IDENT) {  // if tag has a body
            let body = '';

            while(this.tok == TOKEN.IDENT) { 
                body += this.lexer.sval + ' ';
                this.match(TOKEN.IDENT);
            }
            return body;
        }
        this.expected("Open tag");
    }

    attr() {
        if(this.tok = TOKEN.IDENT) {
            let name = this.lexer.sval; // attr name
            this.match(TOKEN.IDENT);
            
            this.match(TOKEN.EQUAL);
            
            // TODO: implement -- this token can also be ident.
            let val = this.lexer.sval;
            this.match(TOKEN.STRING);
            
            return new Attribute(name, val);
        }
        this.expected("ident");
    }

}

let parser = new Parser
    (`
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width">
    <link href="inspector.css" rel="stylesheet" media="all">
    <script src="inspector.js"></script>
    <script src="../math/Number.js"></script>
    <title>Inspector </title>
    </head>
    `);
    
console.log(parser.parse());

