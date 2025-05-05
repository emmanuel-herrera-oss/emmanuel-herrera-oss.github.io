import { useState } from "preact/hooks"

export function BasicCalculatorDemo() {
    const [ expression, setExpression ] = useState('')
    const [ result, setResult ] = useState('')
    const textInputHandler = (e: Event) => {
        setExpression((e.target as HTMLInputElement).value)
    }
    const evaluate = () => {
        const stack: OpData[] = []
        let sb = ''
        const expr = expression.replaceAll(' ', '')
        let prev = 0
        let op = '+'

        for(let i = 0;i < expr.length;i++) {
            const char = expr[i]
            if(char >= '0' && char <= '9') {
                sb += char
            } 
            else if(char == '(') {
                stack.push({
                    prev: prev,
                    op: op
                })
                op = '+'
                prev = 0
                sb = ''
            }
            else if(char == ')') {
                if(sb.length > 0) {
                    const b = Number(sb)
                    prev = operate(prev, b, op)
                    sb = ''
                }
                const opData = stack.pop() as OpData
                prev = operate(opData.prev, prev, opData.op)
            }
            else {
                const b = Number(sb)
                prev = operate(prev, b, op)
                sb = ''
                op = char
            }
        }
        const finalOperand = Number(sb)
        const finalResult = String(operate(prev, finalOperand, op))
        setResult(finalResult)
    }
    const operate = (a: number, b: number, op: string) => {
        if(op == '+') {
            return a + b
        }
        else if(op == '-') {
            return a - b
        }
        else {
            throw new Error(`Unexpected op: ${op}`)
        }
    }
    return <div style={containerStyle}>
        <input type="text" placeholder="Enter an expression" onChange={textInputHandler} value={expression}/>&nbsp;
        <input type="text" placeholder="Result" value={result} readonly disabled/>&nbsp;
        <input type="button" value="Evaluate" onClick={evaluate}></input>
    </div>
}

const containerStyle = {
    width: '100%',
    maxWidth: '100%',
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '1rem'
}
interface OpData {
    prev: number,
    op: string
}