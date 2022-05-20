import { WalletOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  List,
  notification,
  Row,
  Skeleton,
} from "antd";
import { useContext, useEffect, useState } from "react";
import MarketItem from "../components/MarketItem";
import { formatPrice } from "../helpers/utils";
import CollectionContext from "../web3/store/collection-context";
import MarketplaceContext from "../web3/store/marketplace-context";
import Web3Context from "../web3/store/web3-context";
import ethImage from "../images/eth.png";

const Profile = () => {
  const web3Ctx = useContext(Web3Context);
  const collectionCtx = useContext(CollectionContext);
  const marketplaceCtx = useContext(MarketplaceContext);

  const [items, setItems] = useState([]);

  useEffect(() => {
    const result = collectionCtx.collection.filter((nft) => {
      //
      // Not-sale items.
      //
      if (nft.owner == web3Ctx.account) {
        return true;
      }

      //
      // In sale items.
      //
      const nftOffer = marketplaceCtx.getOffer(nft.id);
      if (nftOffer != null && nftOffer.user == web3Ctx.account) {
        return true;
      }

      return false;
    });
    setItems(result);

    if (marketplaceCtx.contract != null && web3Ctx.account != null) {
      marketplaceCtx.loadUserFunds(marketplaceCtx.contract, web3Ctx.account);
    }
  }, [web3Ctx, collectionCtx, marketplaceCtx]);

  const renderItem = (nft, key) => {
    if (Object.keys(nft).length == 0) {
      return (
        <List.Item>
          <Skeleton active />
        </List.Item>
      );
    } else {
      return <MarketItem nft={nft} />;
    }
  };

  const withdraw = async () => {
    if (web3Ctx.account == null) {
      try {
        await window.ethereum.request({
          method: "eth_requestAccounts",
        });
      } catch (error) {
        notification["error"]({
          message: "Error",
          description: error,
        });
      }
      return;
    }

    marketplaceCtx.contract.methods
      .claimFunds()
      .send({
        from: web3Ctx.account,
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

  return (
    <Row gutter={(10, 10)} style={{ margin: 60 }}>
      <Col span={16} offset={4}>
        {marketplaceCtx.mktIsLoading && (
          <Alert message="Processing..." type="info" showIcon />
        )}
      </Col>
      <Col span={16} offset={4} style={{ marginTop: 10 }}>
        <Collapse defaultActiveKey={["1", "2", "3"]}>
          <Collapse.Panel header="Wallet Address" key="1">
            <div align="left">{web3Ctx.account}</div>
          </Collapse.Panel>
          <Collapse.Panel header="My Earning" key="2">
            <Row justify="center" align="middle">
              <img src={ethImage} width={30} height={30} />
              <span
                style={{
                  fontSize: 40,
                  marginLeft: 10,
                }}
              >
                {formatPrice(marketplaceCtx.userFunds)}
              </span>
            </Row>
            <Button
              icon={<WalletOutlined />}
              type="primary"
              style={{ marginTop: 10 }}
              onClick={withdraw}
              disabled={marketplaceCtx.userFunds == 0}
            >
              Withdraw
            </Button>
          </Collapse.Panel>
          <Collapse.Panel header="My NFT" key="3">
            {collectionCtx.nftIsLoading ? (
              <Skeleton />
            ) : (
              <List
                grid={{
                  gutter: 32,
                  xs: 1,
                  sm: 2,
                  md: 3,
                  lg: 3,
                  xl: 3,
                  xxl: 3,
                }}
                locale={{ emptyText: "There's nothing to show!" }}
                dataSource={items}
                renderItem={renderItem}
                pagination={{
                  position: "bottom",
                  pageSize: 6,
                  total: items.length,
                  showTotal: (total) => `Total ${total} items`,
                }}
              />
            )}
          </Collapse.Panel>
        </Collapse>
      </Col>
    </Row>
  );
};

export default Profile;
