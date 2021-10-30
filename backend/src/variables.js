// const { parentPort, workerData } = require("worker_threads");
const { parentPort } = require("worker_threads");
const got = require("got");

const simpleWorkflow = [
  {
    assignVars: {
      assign: [
        {
          number: 5,
        },
        {
          number5_plus_8: "${number+8}",
        },
      ],
      return: "number5_plus_8",
    },
  },
];

const currentDayWorkflow = [
  {
    assignVars: {
      assign: [
        {
          number: 5,
        },
        {
          number5_plus_one: "${number+1}",
        },
        {
          other_number: 10,
        },
        {
          dateTime: undefined,
        },
        {
          string: "hello",
        },
        {
          number: 8,
        },
        {
          number8_plus_three: "${number+3}",
        },
      ],
    },
  },
  {
    getCurrentDay: {
      call: "http.get",
      args: {
        url: "https://us-central1-workflowsample.cloudfunctions.net/datetime",
      },
      result: "dateTime",
      return: "dateTime",
    },
  },
];

parentPort.on("message", async (workflow) => {
  const result = await parseWorkflow(
    workflow === "currentDay" ? currentDayWorkflow : simpleWorkflow
  );
  parentPort.postMessage(result);
});

function getStepName(workflowStep) {
  return Object.keys(workflowStep)[0];
}

function getCommandType({ workflowStep, stepName }) {
  return Object.keys(workflowStep[stepName])[0];
}

async function parseWorkflow(workflow) {
  const variablesState = [];
  for (const [_, workflowStep] of workflow.entries()) {
    const stepName = getStepName(workflowStep);
    const commandType = getCommandType({ workflowStep, stepName });
    switch (commandType) {
      case "assign":
        const assigns = workflowStep[stepName].assign;
        assigns.forEach((element) => {
          const variableName = Object.keys(element)[0];
          const variableValue = evaluateValue({
            value: element[variableName],
            variablesState,
          });
          assignVariable({ variableName, variableValue, variablesState });
        });
        break;
      case "call":
        const httpCall = workflowStep[stepName].call;
        const url = workflowStep[stepName].args.url;
        const resultVariableName = workflowStep[stepName].result;
        if (httpCall !== "http.get")
          throw new Error("only GET supported, tried to use " + httpCall);
        const value = await got(url).json();
        storeToVariablesState({ variablesState, resultVariableName, value });
        break;
      default:
        throw new Error("invalid step name: " + commandType);
    }
    // stops workflow execution
    if (
      Object.keys(workflowStep[stepName]).includes("next") &&
      workflowStep[stepName].next === "end"
    ) {
      return;
    }
    // stops workflow execution and returns a value
    if (Object.keys(workflowStep[stepName]).includes("return")) {
      const variableName = workflowStep[stepName].return;
      return getVariableValue({ variablesState, variableName });
    }
  }
  return variablesState;
}

function storeToVariablesState({ variablesState, resultVariableName, value }) {
  const indexInVariablesState = variablesState.findIndex(
    (variable) => variable.identifier === resultVariableName
  );
  variablesState[indexInVariablesState] = {
    identifier: resultVariableName,
    value,
  };
}

function getVariableValue({ variablesState, variableName }) {
  return variablesState.find((el) => el.identifier === variableName);
}

function evaluateValue({ value, variablesState }) {
  if (typeof value === "string" && value[0] === "$") {
    const regex = /\$\{(\w*)(\W)(.*)\}/g;
    const matches = regex.exec(value);
    const variableName = matches[1];

    const sourceVariableValue = variablesState.find(
      (el) => el.identifier === variableName
    )?.value;
    const operator = matches[2];
    const operand = matches[3];

    const evaluate = {
      "+": function (x, y) {
        return x + y;
      },
      "-": function (x, y) {
        return x - y;
      },
      "/": function (x, y) {
        return x / y;
      },
      "*": function (x, y) {
        return x * y;
      },
    };
    return evaluate[operator](
      sourceVariableValue,
      typeof sourceVariableValue === "number" ? parseInt(operand) : operand
    );
  } else {
    return value;
  }
}

function assignVariable({ variableName, variableValue, variablesState }) {
  const foundVariableIndex = variablesState.findIndex(
    ({ identifier }) => identifier === variableName
  );
  if (foundVariableIndex > -1) {
    if (variableValue === null) {
      variablesState.splice(foundVariableIndex, 1);
    } else {
      variablesState[foundVariableIndex] = {
        identifier: variablesState[foundVariableIndex].identifier,
        value: variableValue,
      };
    }
  } else {
    variablesState.push({ identifier: variableName, value: variableValue });
  }
}
