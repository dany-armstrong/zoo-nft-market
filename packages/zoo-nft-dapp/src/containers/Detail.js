import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Form,
  Image,
  Input,
  InputNumber,
  notification,
  Result,
  Row,
  Skeleton,
} from "antd";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { WalletOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import CollectionContext from "../web3/store/collection-context";
import MarketplaceContext from "../web3/store/marketplace-context";
import Web3Context from "../web3/store/web3-context";
import "./Details.css";
import ethImage from "../images/eth.png";
import { formatPrice } from "../helpers/utils";
import { useForm } from "antd/lib/form/Form";
import web3 from "../web3/connection/web3";

const Detail = () => {
  let { id } = useParams();
  let navigate = useNavigate();
  const [createSaleForm] = useForm();
  const web3Ctx = useContext(Web3Context);
  const collectionCtx = useContext(CollectionContext);
  const marketplaceCtx = useContext(MarketplaceContext);
  const [nft, setNft] = useState(null);
  const [offer, setOffer] = useState(null);
  const [invalidId, setInvalidId] = useState(false);

  const loadNft = () => {
    let nft = collectionCtx.collection.find((value) => value.id == id);
    if (nft == undefined) {
      setInvalidId(true);
      return;
    }
    setNft(nft);
  };

  const loadOffer = () => {
    const offer = marketplaceCtx.offers
      ? marketplaceCtx.offers.find((offer) => offer.id == id)
      : null;
    setOffer(offer);
  };

  useEffect(() => {
    loadNft();
    loadOffer();
  }, [web3Ctx, collectionCtx, marketplaceCtx]);

  const owner = offer == null ? (nft != null ? nft.owner : "") : offer.user;

  if (invalidId) {
    return (
      <Result
        status="warning"
        title="Sorry, the item you visited does not exist."
        extra={
          <Button
            type="primary"
            key="console"
            onClick={() => navigate("/market")}
          >
            Go Market
          </Button>
        }
      />
    );
  }

  if (nft == null) {
    return <Skeleton active />;
  }

  const renderBuy = () => {
    return (
      <Card title="Sale" style={{ marginBottom: 10 }}>
        <Row justify="center" align="middle">
          <img src={ethImage} width={30} height={30} />
          <span
            style={{
              fontSize: 40,
              marginLeft: 10,
            }}
          >
            {formatPrice(offer.price)}
          </span>
        </Row>
        <Button
          icon={<WalletOutlined />}
          type="primary"
          style={{ marginTop: 10 }}
          onClick={buy}
        >
          Buy
        </Button>
      </Card>
    );
  };

  const buy = () => {
    marketplaceCtx.contract.methods
      .fillOffer(offer.offerId)
      .send({
        from: web3Ctx.account,
        value: offer.price,
      })
      .on("transactionHash", (hash) => {
        marketplaceCtx.setMktIsLoading(true);
      })
      .on("error", (error) => {
        notification["error"]({
          message: "Error",
          description: "Something went wrong when pushing to the blockchain",
        });
        marketplaceCtx.setMktIsLoading(false);
      });
  };

  const renderMySale = () => {
    return (
      <Card title="Sale" style={{ marginBottom: 10 }}>
        <Row justify="center" align="middle">
          <img src={ethImage} width={30} height={30} />
          <span
            style={{
              fontSize: 40,
              marginLeft: 10,
            }}
          >
            {formatPrice(offer.price)}
          </span>
        </Row>
        <Button
          type="primary"
          onClick={cancelOffer}
          style={{ marginTop: 10, background: "red", borderColor: "red" }}
        >
          Cancel
        </Button>
      </Card>
    );
  };

  const cancelOffer = () => {
    marketplaceCtx.contract.methods
      .cancelOffer(offer.offerId)
      .send({ from: web3Ctx.account })
      .on("transactionHash", (hash) => {
        marketplaceCtx.setMktIsLoading(true);
      })
      .on("error", (error) => {
        notification["error"]({
          message: "Error",
          description: "Something went wrong when pushing to the blockchain",
        });
        marketplaceCtx.setMktIsLoading(false);
      });
  };

  const renderCreateSale = () => {
    return (
      <Card title="Create Sale" style={{ marginBottom: 20 }}>
        <Form form={createSaleForm} layout="inline" onFinish={createSale}>
          <Form.Item
            label="Price"
            name="price"
            rules={[{ required: true, message: "Please input price!" }]}
          >
            <InputNumber
              addonBefore={<img src={ethImage} width={14} height={14} />}
              placeholder="0.0"
            />
          </Form.Item>

          <Form.Item>
            <Button
              icon={<ShoppingCartOutlined />}
              type="primary"
              htmlType="submit"
              style={{ background: "green", borderColor: "green" }}
            >
              Create
            </Button>
          </Form.Item>
        </Form>
      </Card>
    );
  };

  const createSale = (values) => {
    let { price } = values;
    const enteredPrice = web3.utils.toWei(price.toString(), "ether");

    collectionCtx.contract.methods
      .approve(marketplaceCtx.contract.options.address, nft.id)
      .send({ from: web3Ctx.account })
      .on("transactionHash", (hash) => {
        marketplaceCtx.setMktIsLoading(true);
      })
      .on("confirmation", (confirmationNumber, receipt) => {
        if (confirmationNumber == 0) {
          marketplaceCtx.contract.methods
            .makeOffer(nft.id, enteredPrice)
            .send({ from: web3Ctx.account })
            .on("error", (error) => {
              notification["error"]({
                message: "Error",
                description:
                  "Something went wrong when pushing to the blockchain",
              });
              marketplaceCtx.setMktIsLoading(false);
            });
        }
      });
  };

  return (
    <Row style={{ margin: 20 }}>
      <Col span={16} offset={4} style={{ marginTop: 10 }}>
        {nft == null && <Skeleton active />}
        {nft != null && (
          <>
            {marketplaceCtx.mktIsLoading && (
              <Alert message="Processing..." type="info" showIcon />
            )}
            <Card title={"Zoo NFT #" + nft.id} style={{ marginTop: 10 }}>
              <Row>
                <img
                  src={`https://ipfs.infura.io/ipfs/${nft.img}`}
                  className="Image"
                />
                <Col flex={1} style={{ marginLeft: 20 }}>
                  {offer != null &&
                    offer.user != web3Ctx.account &&
                    renderBuy()}
                  {offer != null &&
                    offer.user == web3Ctx.account &&
                    renderMySale()}
                  {offer == null &&
                    nft.owner == web3Ctx.account &&
                    renderCreateSale()}

                  <Collapse defaultActiveKey={["1", "2", "3"]}>
                    <Collapse.Panel header="Title" key="1">
                      <div align="left">{nft.title}</div>
                    </Collapse.Panel>
                    <Collapse.Panel header="Description" key="2">
                      <div align="left">{nft.description}</div>
                    </Collapse.Panel>
                    <Collapse.Panel header="Owner" key="3">
                      <div align="left">{owner}</div>
                    </Collapse.Panel>
                  </Collapse>
                </Col>
              </Row>
            </Card>
          </>
        )}
      </Col>
    </Row>
  );
};

export default Detail;
