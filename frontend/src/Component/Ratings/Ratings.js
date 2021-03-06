import React from "react";
import "./RatingsStyles.css";

import StockTable from "./RatingsStockTable";
import StockDescriptionFull from "../StockTable/StockDescriptionFull";
import { Table } from "reactstrap";
import axios from "axios";

export default class Ratings extends React.Component {
  render() {
    return <StockAPI />;
  }
}

export class StockAPI extends React.Component {
  constructor() {
    super();

    this.state = {
      stockRatings: [],
    };

    this.user = localStorage.getItem("token");

    this.deleteFaveData = this.deleteFaveData.bind(this);
    this.getFaveData = this.getFaveData.bind(this);
    this.addFaveData = this.addFaveData.bind(this);
    this.callStockAPI = this.callStockAPI.bind(this);
  }

  componentDidMount() {
    this.getData();
  }

  callStockAPI(input) {
    let api = `https://yahoo-finance15.p.rapidapi.com/api/yahoo/qu/quote/${input}`;

    fetch(api, {
      method: "GET",
      headers: {
        "x-rapidapi-key": process.env.REACT_APP_RAPIDAPI_KEY,
        "x-rapidapi-host": "yahoo-finance15.p.rapidapi.com",
      },
    })
      .then((res) => {
        return res.json();
      })
      .then((stockResult) => {
        // Unify the "longName" key in each object to "name", in order to fit the syntax of Bloomberg API
        const mappedStockResult = stockResult.map((item) => {
          let obj = { ...item };
          obj["name"] = item["longName"];
          return obj;
        });
        this.setState({
          stockRatings: mappedStockResult,
        });
      })
      .catch((err) => console.error(err));
  }

  // Change the color of the button
  changeDeleteButtonStyle(symbol) {
    let buttonAdd = document.getElementsByClassName(`${symbol}-add`);
    let buttonDelete = document.getElementsByClassName(`${symbol}-delete`);

    let displayArray = ["display: initial", "display: none"];

    for (let i = 0; i < buttonAdd.length; i++) {
      buttonAdd[i].setAttribute("style", displayArray[1]);
    }
    for (let i = 0; i < buttonDelete.length; i++) {
      buttonDelete[i].setAttribute("style", displayArray[0]);
    }
  }

  changeAddButtonStyle(symbol) {
    let buttonAdd = document.getElementsByClassName(`${symbol}-add`);
    let buttonDelete = document.getElementsByClassName(`${symbol}-delete`);

    let displayArray = ["display: initial", "display: none"];

    for (let i = 0; i < buttonAdd.length; i++) {
      buttonAdd[i].setAttribute("style", displayArray[0]);
    }
    for (let i = 0; i < buttonDelete.length; i++) {
      buttonDelete[i].setAttribute("style", displayArray[1]);
    }
  }

  // Rankings
  getData() {
    axios
      .get(`${process.env.REACT_APP_API_SERVER}/api/ratings/stock`, {
        headers: { Authorization: `Bearer ${this.user}` },
      })
      .then((res) => {
        // Push all symbols into a single array
        let symbolArray = [];
        let symbolCountObj = {};
        for (let item of res.data.flat(1)) {
          symbolArray.push(item.symbol);
        }
        // Count the symbols, then sort them
        symbolArray.forEach(function (symbol) {
          symbolCountObj[symbol] = (symbolCountObj[symbol] || 0) + 1;
        });

        let sortedSymbolArray = Object.entries(symbolCountObj).sort(
          (a, b) => b[1] - a[1],
        );

        let ratingsSymbol = sortedSymbolArray
          .map((item) => item[0])
          .slice(0, 20);

        this.callStockAPI(ratingsSymbol.toString());
      })
      .catch((err) => console.error(err));
  }

  // Fave
  getFaveData(stock) {
    axios
      .get(`${process.env.REACT_APP_API_SERVER}/api/stock/`, {
        headers: { Authorization: `Bearer ${this.user}` },
      })
      .then((res) => {
        if (res.data.some((row) => row.symbol === stock["symbol"])) {
          this.changeDeleteButtonStyle(stock["symbol"]);
        } else {
        }
      })
      .catch((err) => console.error(err));
  }

  addFaveData(stock) {
    axios
      .post(
        `${process.env.REACT_APP_API_SERVER}/api/stock/`,
        {
          company: stock["name"],
          symbol: stock["symbol"],
        },
        {
          headers: { Authorization: `Bearer ${this.user}` },
        },
      )
      .then((res) => {
        if (res.data.some((row) => row.symbol === stock["symbol"])) {
          this.changeDeleteButtonStyle(stock["symbol"]);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }

  deleteFaveData(stock) {
    axios
      .delete(
        `${process.env.REACT_APP_API_SERVER}/api/stock/${stock["symbol"]}`,
        {
          headers: { Authorization: `Bearer ${this.user}` },
        },
      )
      .then((res) => {
        if (res.data.some((row) => row.symbol !== stock["symbol"])) {
          this.changeAddButtonStyle(stock["symbol"]);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }

  render() {
    const { stockRatings } = this.state;

    return (
      <div className="ratings-wrapper">
        <h1 className="ratings-headline12">Top 20 Hot Stocks</h1>
        <div className="top-20-list">
          <div className="ratings-list-stocks-list1">
            <div className="ratings-container stocks-container">
              <Table striped className="ratings-table stock-table">
                <thead>{StockDescriptionFull()}</thead>
                <tbody>
                  <StockTable
                    type={stockRatings}
                    add={this.addFaveData}
                    delete={this.deleteFaveData}
                    getFave={this.getFaveData}
                  />
                </tbody>
              </Table>
            </div>
          </div>

          <div className="button stock-refresh-button"></div>
        </div>
      </div>
    );
  }
}

// "x-rapidapi-key": "a2ee38ed73mshd61421606491fb7p1a46d1jsnd6ecf75b7c6b"
