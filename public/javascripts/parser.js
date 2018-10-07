var html = require('html');
var url = require('url');

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
    constructor(start, content, end)  {
        this.start = start;
        this.content = content;
        this.end = end;
    }

    toString() {
        let str = this.start;

        if(this.content != undefined) {
            str += this.content.toString();
        }

        if(this.end != undefined) {
            str += this.end;
        }
        return str;
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

        for(const accessor in Parser.tagRules) {
            Parser.tagRules[accessor](this);
        }
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

        if(this.type == TagType.VOID) {
            str += '/';
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

class Content {
    constructor(content) {
        this.content = content;
    }

    toString() {
        return this.content.toString();
    }
}

class ElementContent extends Content {
    constructor(element) {
        super(element);
    }
}

class TextContent extends Content {
    constructor(text) {
        super(text);
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
        
        Parser.tagRules = []; // static var - rules
    }

    addTagRule(rule) {
        Parser.tagRules.push(rule);
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
        console.log('Expected: '+s+', Found: ' + this.tok);
    }

    parse() {
        this.tok = this.lexer.nextToken();

        let html='';
        while(this.tok != TOKEN.EOF) {
            if(this.tok == TOKEN.IDENT || this.tok == TOKEN.STRING) {
                html += this.content().toString();
            } else {
                html += this.element().toString(); // should call element();
            }
        }

        return html;
    }

    element() {
        let start = this.tag();
        if(start.type == TagType.VOID) {
            return new Element(start, undefined, undefined);
        }else if(start.type == TagType.END) {
            return start;
        }

        let content;
        if(this.tok == TOKEN.IDENT || this.tok == TOKEN.STRING) {
            content = this.content(); // text content
        } else if(this.tok == TOKEN.OPENTAG) {
            content = new ElementContent(this.element());
        }

        let end;
        if(this.tok == TOKEN.OPENTAG) {
            end = this.tag();
        }

        return new Element(start, content, end);
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
            while(this.tok == TOKEN.IDENT) { // attributes
                let attr = this.attr();
                attributes[attr.name] = attr;
            }

            if(this.tok == TOKEN.SLASH) {
                type = TagType.VOID;
                this.match(TOKEN.SLASH);
            }

            this.match(TOKEN.CLOSETAG);

            return new Tag(type, tagName, attributes);
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

    content() {
        if (this.tok == TOKEN.IDENT) {  // if tag has a body
            let body = '';

            while(this.tok == TOKEN.IDENT) { 
                body += this.lexer.sval + ' ';
                this.match(TOKEN.IDENT);
            }
            return new TextContent(body);
        }
    }

}

let parser = new Parser
    (`
    <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width">
    <link href="inspector.css" rel="stylesheet" media="all">
    <script src="inspector.js"></script>
    <script src="../math/Number.js"></script>
    <title>Inspector </title>
    </head>
    `);

/* the lines below is for testing here. They should be placed in
sss.js */
function adjustURL(requestedURL, refURL) {
    let parsed = url.parse(refURL, true);

    let parsedRequestURL = url.parse(requestedURL, true);

    let protocol;
    let host;
    let path='';

    if(parsed.protocol != undefined) {
        return parsed.href;
    } 

    protocol = "http://";

    if(parsedRequestURL.host == undefined) {
        host = '';
    } else {
        host = parsedRequestURL.host;
    }

    if(parsed.path[0] != '/') {
        let p = parsedRequestURL.path;
        let lastParanthesisIndex = p.lastIndexOf('/');
        path += p.substr(0, lastParanthesisIndex+1);
    }

    path += parsed.path;

    return protocol + host + path;
}

function cleanQuotes(str) {
    return str.substr(1,str.length-2);
}

parser.addTagRule((tag) => {
    if(tag.name == 'link' && tag.attrs['href']) {
        let href = cleanQuotes(tag.attrs['href'].val);
        tag.attrs['href'].val = '"' + adjustURL("https://maeyler.github.io/JS/sss/inspector.html", href) + '"';
    }
});

parser.addTagRule((tag) => {
    if(tag.name == 'script' && tag.attrs['src']) {
        let src = cleanQuotes(tag.attrs['src'].val);
        tag.attrs['src'].val = '"' +adjustURL("https://maeyler.github.io/JS/sss/inspector.html", src) + '"';
    }
});

    
console.log(html.prettyPrint(parser.parse()));