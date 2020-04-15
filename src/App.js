import React from "react";
import "./App.scss";
import calculatorWordList from "./calculatorWordList";

class InputPad extends React.Component {
  componentDidMount() {
    document.addEventListener("keydown", (event) => {
      event.preventDefault();
      let { key } = event;
      if (key === "Shift") {
        return;
      }
      this.handleKeyPress(parseInt(key) || key);
    });
  }

  componentWillUnmount() {
    document.removeEventListener("keydown");
  }

  handleKeyPress = (key) => {
    if (typeof key === "number" || key === "." || key === "0") {
      this.props.onNum(key);
    } else {
      switch (key) {
        case "Backspace":
        case "c":
        case "C":
          this.props.onClear(false);
          break;

        case "÷":
        case "/":
          this.props.onOperator("/");
          break;

        case "*":
        case "x":
        case "X":
          this.props.onOperator("x");
          break;

        case "-":
        case "−":
          this.props.onOperator("-");
          break;

        case "+":
          this.props.onOperator("+");
          break;

        case "=":
        case "Enter":
          this.props.onResult();
          break;

        default:
          break;
      }
    }
  };
  handleButtonPress = () => {
    this.buttonPressTimer = setTimeout(() => {
      this.long = true;
    }, 600);
  };
  handleButtonRelease(i) {
    clearTimeout(this.buttonPressTimer);
    if (this.long) {
      this.long = false;
      i === "c" && this.props.onClear(true);
    } else this.handleKeyPress(i);
  }
  render() {
    let numButtons = [
      [7, 8, 9],
      [4, 5, 6],
      [1, 2, 3],
      [0, ".", "="],
    ];
    let opButtons = ["c", "÷", "x", "−", "+"];

    let numRows = numButtons.map((row, index) => {
      return (
        <div className="row" key={index}>
          {row.map((i) => {
            return (
              <div
                className="numberButton"
                key={i}
                onClick={() => this.handleKeyPress(i)}
              >
                {i}
              </div>
            );
          })}
        </div>
      );
    });

    let opRows = opButtons.map((i) => {
      return (
        <div className="row" key={i}>
          <div
            className="operatorButton"
            onMouseDown={this.handleButtonPress}
            onMouseUp={() => this.handleButtonRelease(i)}
            // onMouseLeave={() => this.handleButtonRelease(i)}
            onTouchStart={this.handleButtonPress}
            onTouchEnd={() => this.handleButtonRelease(i)}
          >
            {i}
          </div>
        </div>
      );
    });

    return (
      <div className="button-container">
        <div className="numbers-grid">{numRows}</div>
        <div className="operators-list">{opRows}</div>
      </div>
    );
  }
}

class DisplayUnit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      upsideDown: false,
    };
  }
  componentDidMount() {
    if (window.DeviceOrientationEvent) {
      window.addEventListener(
        "deviceorientation",
        ({ alpha, beta, gamma }) => {
          if (between(beta, -150, -70) || between(Math.abs(gamma), 160, 200)) {
            this.state.upsideDown || this.setState({ upsideDown: true });
          } else
            this.state.upsideDown &&
              this.setState({ upsideDown: false }, () => {
                console.log("state Updated");
              });
        },
        false
      );
    }
    function between(v, a, b) {
      if (v >= a && v <= b) {
        return true;
      } else return false;
    }
  }
  getCalcWord(value) {
    let calcWord = calculatorWordList[value];
    return calcWord ? (
      <span className="rotate">{calcWord.toUpperCase()}</span>
    ) : (
      value
    );
  }
  render() {
    let currentDisplay = this.state.upsideDown
      ? this.getCalcWord(this.props.currentDisplay)
      : this.props.currentDisplay;
    return (
      <div className="display">
        <div className="old-display">
          <span className="textBottom">{this.props.oldDisplay}</span>
        </div>
        <div className="current-display">
          <span className="textBottom">{currentDisplay}</span>
        </div>
      </div>
    );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      firstOperand: "",
      secondOperand: "",
      operator: "",
      result: "",
    };
    this.baseState = this.state;
  }

  handleNum = (num) => {
    let state = Object.assign(
      {},
      this.state.result ? this.baseState : this.state
    );
    let key = state.operator ? "secondOperand" : "firstOperand";
    this.inputNumToState(state, key, num);
    this.setState(state);
  };

  inputNumToState = (state, key, num) => {
    let value = state[key];
    if (!(num === "." && value.indexOf(".") !== -1))
      state[key] = `${value}${num}`
        .replace(/[^.]*/, (match) => {
          return parseInt(match.slice(-15)) || 0;
        })
        .slice(-15);
  };

  handleOperator = (operator) => {
    let { result, secondOperand } = this.state;

    let state;
    let firstOperand;
    if (result || secondOperand) {
      state = Object.assign({}, this.baseState);
      result = result || this.calculate();
      firstOperand = result === "ERROR" ? "0" : result;
    } else {
      state = Object.assign({}, this.state);
      if (!state.firstOperand) {
        firstOperand = "0";
      }
    }

    if (firstOperand) this.inputNumToState(state, "firstOperand", firstOperand);
    state.operator = operator;

    this.setState(state);
  };

  calculate = () => {
    let { firstOperand, secondOperand, operator } = this.state;
    if (!operator) return "";
    if (!secondOperand) [secondOperand, firstOperand] = [firstOperand, 0];
    firstOperand = parseFloat(firstOperand);
    secondOperand = parseFloat(secondOperand);
    let result;
    switch (operator) {
      case "+":
        result = firstOperand + secondOperand;
        break;
      case "-":
        result = firstOperand - secondOperand;
        break;
      case "x":
        result = firstOperand * secondOperand;
        break;
      case "/":
        result = secondOperand === 0 ? "ERROR" : firstOperand / secondOperand;
        break;

      default:
        break;
    }
    return result.toString().length > 15 ? result.toExponential(9) : result;
  };

  handleResult = () => {
    this.setState({ result: this.calculate().toString() });
  };

  handleClear = (reset) => {
    if (this.state.result || reset) this.setState(this.baseState);
    else {
      let { firstOperand, secondOperand, operator } = this.state;
      if (secondOperand)
        this.setState({ secondOperand: secondOperand.slice(0, -1) });
      else if (operator) this.setState({ operator: operator.slice(0, -1) });
      else this.setState({ firstOperand: firstOperand.slice(0, -1) });
    }
  };

  render() {
    let { firstOperand, secondOperand, operator, result } = this.state;
    let currentDisplay =
      result || secondOperand || operator || firstOperand || "0";
    let oldDisplay =
      (operator ? firstOperand : "") +
      (secondOperand ? ` ${operator}` : "") +
      (result ? ` ${secondOperand}` : "");
    return (
      <div className="App">
        <div className="card">
          <DisplayUnit
            currentDisplay={currentDisplay}
            oldDisplay={oldDisplay}
          />
          <InputPad
            onNum={this.handleNum}
            onOperator={this.handleOperator}
            onClear={this.handleClear}
            onResult={this.handleResult}
          />
        </div>
      </div>
    );
  }
}

export default App;
