import React from "react";
import ForceGraph from "react-force-graph-2d";

interface IAppProps {}

interface IAppState {
  data: IData;
}

interface IData {
  nodes: [{ id: string; group: number }];
  links: [{ source: string; target: string; value: number }];
}

class App extends React.Component<IAppProps, IAppState> {
  constructor(props: IAppProps) {
    super(props);
    this.state = { data: {} as IData };
  }

  public async componentDidMount(): Promise<void> {
    const mockdata: Response = await fetch("data/mockdata.json");
    const data: IData = await mockdata.json();
    this.setState({ data });
  }

  render() {
    return (
      <div className="App">
        {Object.keys(this.state.data).length > 0 && (
          <ForceGraph graphData={this.state.data} nodeAutoColorBy={"group"} />
        )}
      </div>
    );
  }
}

export default App;
