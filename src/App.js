import React, { useState, useEffect } from 'react';
import './App.css';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryLabel, VictoryZoomContainer } from 'victory';
import { Container, Navbar, DropdownButton, Dropdown } from 'react-bootstrap';

const axios = require("axios"); // For HTTP-requests


const App = () => {
   // Kuukausittaiset yöpymiset ja saapuneet asuinmaittain muuttujina Maa, Alue, Tiedot ja Kuukausi
   // Hakee alkuun kaikki alueet, kaiken maalaiset, yöpymiset lkm sekä kuukaudet vuosilta 1995 - 2019
   const [query, setQuery] = useState({
      query: [
         //{ code: "Alue", selection: { filter: "item", values: ["*_**_***_***"] } },
         { code: "Maa", selection: { filter: "item", values: ["SS"] } },
         { code: "Tiedot", selection: { filter: "item", values: ["yot"] } }
      ],
      response: { format: "json" }
   })
   const [metaData, setMetaData] = useState({})
   const [data, setData] = useState([])
   const [filteredData, setFilteredData] = useState([])
   const [filter, setFilters] = useState(["*_**_***_***", "Koko Maa"])

   const handleDataChange = (data, filtersArr) => {
      let filteredData = [];
      let filters = filtersArr[0];
      // loop through fetched data
      data.forEach(dataObj => {
         let obj = {};
         if (dataObj.key.includes(filters)) {
            // convert date strings
            obj.key = new Date(dataObj.key[2].replace("M", "-") + "-1");
            obj.value = isNaN(parseInt(dataObj.values[0])) ? 0 : parseInt(dataObj.values[0]);
            filteredData.push(obj)
         }
      });
      console.log("Filtered data:\n", filteredData)
      setFilteredData(filteredData);
      setFilters(filtersArr)
   }

   useEffect(() => {

      const getTableMetaData = (metaData) => {
         let meta = {};
         metaData.variables.forEach(variable => {
            // convert filter name to lower case 
            let code = variable.code.toLowerCase()
            meta[code] = [];
            for (let i = 0; i < variable.values.length; i++) {
               meta[code].push([variable.values[i], variable.valueTexts[i]])
            }
         });
         console.log("Table metadata:\n", meta)
         setMetaData(meta);
      }
      const getData = async () => {
         //console.log("Sending query\n", query)
         let baseURL = "http://visitfinland.stat.fi/pxweb/api/v1/fi/VisitFinland";
         let statisctic = "Majoitustilastot/visitfinland_matk_pxt_116n.px";
         try {
            // GET-method returns metadata
            let tableMetaPromise = axios(`${baseURL}/${statisctic}`)
            // POST-method returns values
            let tablePromise = axios({
               method: 'post',
               url: `${baseURL}/${statisctic}`,
               data: query
            })
            let tableMeta = await tableMetaPromise;
            let table = await tablePromise;
            console.log("Fetched data:\n", table.data.data)
            setData(table.data.data)
            getTableMetaData(tableMeta.data)
            handleDataChange(table.data.data, filter)
         } catch (e) {
            console.log("Something went wrong\n", e)
         }
      }
      getData()

   }, [query]) // Fetch again only if query variable changes


   return (
      <>
         <Navbar variant="dark" className="mb-5 navbar">
            <Navbar.Brand>
               Rudolf Demo
            </Navbar.Brand>
         </Navbar>
         {filteredData.length === 0 &&
            <div className="loader-container">
               <div className="lds-dual-ring"></div>
            </div>
         }
         <Container>
            {metaData.alue &&
               <DropdownButton variant="transparent" title={filter[1]}>
                  <div className="scrollable-menu rounded-lg">
                     {
                        metaData.alue.map(alue => <Dropdown.Item className="dropdown-item" onClick={() => handleDataChange(data, [alue[0], alue[1]])} key={alue[0]}>{alue[1]}</Dropdown.Item>)
                     }
                  </div>
               </DropdownButton>
            }
            {filteredData.length > 0 &&
               <div className="chart-container bg-white px-5 py-2 shadow">
                  <VictoryChart
                     scale={{ x: "time" }}
                     containerComponent={
                        <VictoryZoomContainer
                           zoomDimension="x"
                        />
                     }>
                     <VictoryLabel text="Kuukausittaiset yöpymiset" x={225} y={30} textAnchor="middle" />
                     <VictoryAxis
                        style={{
                           tickLabels: { fontSize: 8, padding: 5 }
                        }}
                     />
                     <VictoryAxis
                        dependentAxis
                        label="Yöpymiset (lkm)"
                        style={{
                           axisLabel: { fontSize: 7, padding: 42 },
                           tickLabels: { fontSize: 8, padding: 5 },
                           grid: { stroke: "lightgray", strokeDasharray: 10 }
                        }}
                     />
                     <VictoryLine
                        interpolation={"natural"}
                        style={{
                           data: { stroke: "#2193b0", strokeWidth: 1 },
                        }}
                        data={filteredData}
                        x="key"
                        y="value"
                     />
                  </VictoryChart>
               </div>
            }
         </Container>
      </>
   );
}

export default App;
